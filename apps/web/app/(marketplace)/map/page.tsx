import { permanentRedirect } from 'next/navigation';

/** /map is the address people guess; the map itself lives at /map/locations. */
export default function MapIndex() {
  permanentRedirect('/map/locations');
}
