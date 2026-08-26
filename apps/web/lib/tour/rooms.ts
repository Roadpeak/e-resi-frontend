import * as THREE from 'three';

/**
 * Rooms, read out of the model itself.
 *
 * A scanned or authored building arrives with its rooms already named — a
 * Sketchfab capture of a flat carries `Sala_Cozinha`, `Quartos`,
 * `Banheiros_Corredor`, and so on — because whoever modelled it had to call
 * them something. That naming is the only description of the building's
 * interior we get for free, and until now the viewer ignored it entirely:
 * it highlighted a hardcoded list of five placeholder rooms at invented
 * coordinates, which meant "Master Bedroom" lit up an empty patch of space
 * beside whatever building was actually loaded.
 *
 * This derives the real thing. Each named group becomes a room with a real
 * centre and a real size, so the camera can be sent to it and the tour can be
 * built without anyone typing a coordinate.
 *
 * It is a heuristic, not a contract: a model with no useful names yields
 * nothing and the caller falls back to whatever it did before. That is the
 * right failure — a wrong room is worse than no room.
 */

export interface DerivedRoom {
  id: string;
  /** Human label, cleaned up from the node name. */
  label: string;
  /** World-space centre, after the model's own recentring transform. */
  centre: [number, number, number];
  size: [number, number, number];
  /** Longest horizontal dimension, for ordering and camera distance. */
  extent: number;
}

/**
 * Node names that describe structure rather than a room a buyer walks into.
 *
 * A ceiling is a named group like any other but nobody tours one, and an
 * exporter's own scaffolding (`Sketchfab_model`, `GLTF_SceneRootNode`) would
 * otherwise become the largest "room" in the building.
 */
const SKIP = [
  /^sketchfab/i, /^gltf_?scene/i, /^root$/i, /^scene$/i, /^object_?\d*$/i,
  /^rootnode/i, /^node_?\d*$/i, /^mesh_?\d*$/i,
  // Structure, not rooms.
  /teto/i, /ceiling/i, /roof/i, /plafond/i, /^walls?$/i, /^floors?$/i,
  /^sol$/i, /^piso$/i, /^parede/i, /light|lamp|sun/i,
];

/**
 * Words a modeller uses that a buyer would not, in the languages these models
 * tend to arrive in — Sketchfab captures are frequently Portuguese, French or
 * Spanish. Translating them is what turns `Banheiros_Corredor` into
 * "Bathrooms & Corridor" rather than leaving a buyer to guess.
 */
const GLOSS: Array<[RegExp, string]> = [
  [/banheiro?s?/i, 'Bathroom'],
  [/corredor/i, 'Corridor'],
  [/quartos?/i, 'Bedroom'],
  [/chambre\s*0?(\d+)?/i, 'Bedroom'],
  [/sala/i, 'Living'],
  [/cozinha/i, 'Kitchen'],
  [/cuisine/i, 'Kitchen'],
  [/salon/i, 'Living'],
  [/salle\s*de\s*bain/i, 'Bathroom'],
  [/dormitorio/i, 'Bedroom'],
  [/cocina/i, 'Kitchen'],
  [/bano|baño/i, 'Bathroom'],
  [/varanda|balcon/i, 'Balcony'],
  [/escritorio|bureau/i, 'Study'],
  [/lavanderia/i, 'Laundry'],
  [/garagem|garage/i, 'Garage'],
  [/meuble|mobilia|furniture/i, ''],
  [/lit\b|cama\b|bed\b/i, ''],
];

/** `Banheiros_Corredor_0` → `Bathroom & Corridor`. */
function labelFor(raw: string): string {
  // Trailing `_0`, `_1` are the exporter's group index, not part of the name.
  const base = raw.replace(/_\d+$/, '');
  const parts = base
    .split(/[_\-.]+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const glossed = parts
    .map((w) => {
      for (const [re, to] of GLOSS) if (re.test(w)) return to;
      // Split camelCase and title-case anything we have no gloss for, so an
      // unknown name still reads as words rather than as an identifier.
      return w
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .filter(Boolean);

  // De-duplicate: `Quartos_Quarto` should not read "Bedroom Bedroom".
  const seen = new Set<string>();
  const unique = glossed.filter((w) => {
    const k = w.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return unique.length ? unique.join(' & ') : base;
}

/**
 * Walk the loaded scene and return the rooms worth touring.
 *
 * `object` must already carry whatever transform the viewer applied — the
 * caller measures after positioning, so the boxes here are in the same world
 * space the camera works in. Getting that wrong is the difference between a
 * camera that arrives in the kitchen and one that arrives in the car park.
 */
export function deriveRooms(object: THREE.Object3D): DerivedRoom[] {
  const rooms: DerivedRoom[] = [];
  const box = new THREE.Box3();
  const centre = new THREE.Vector3();
  const size = new THREE.Vector3();

  object.traverse((node) => {
    const name = node.name ?? '';
    if (!name || SKIP.some((re) => re.test(name))) return;
    // Only groups that actually contain geometry. A named empty is a pivot.
    let hasMesh = false;
    node.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) hasMesh = true;
    });
    if (!hasMesh) return;

    box.setFromObject(node);
    if (box.isEmpty()) return;
    box.getCenter(centre);
    box.getSize(size);

    // A room a person stands in has floor area and height. This drops door
    // panels, skirting and stray props that happen to be named.
    const footprint = size.x * size.z;
    if (footprint < 1.5 || size.y < 0.8) return;

    rooms.push({
      id: `room-${rooms.length}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label: labelFor(name),
      centre: [centre.x, centre.y, centre.z],
      size: [size.x, size.y, size.z],
      extent: Math.max(size.x, size.z),
    });
  });

  /**
   * Drop rooms that contain another room.
   *
   * Exporters nest — a `Quartos` group can hold a `Chambre01_Meuble_Lit`
   * inside it — and both pass the tests above. Keeping the parent would send
   * the camera to the centre of a volume it has already visited, so the more
   * specific one wins.
   */
  const kept = rooms.filter((r, i) =>
    !rooms.some((other, j) => {
      if (i === j) return false;
      const contains = (['0', '1', '2'] as const).every((k) => {
        const a = Number(k);
        return (
          Math.abs(other.centre[a] - r.centre[a]) + other.size[a] / 2 <= r.size[a] / 2 + 0.01
        );
      });
      // Only drop the parent if the child is a meaningful part of it, not a
      // doorknob inside a wall.
      return contains && other.size[0] * other.size[2] > r.size[0] * r.size[2] * 0.25;
    }),
  );

  // Largest first: a tour that opens in the living room reads better than one
  // that opens in a corridor, and the biggest space is almost always the one a
  // buyer is being sold.
  return (kept.length ? kept : rooms).sort((a, b) => b.extent - a.extent);
}
