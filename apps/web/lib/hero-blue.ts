/** The homepage hero tells the navbar to drop its dark bar while the blue "What are you interested in?" step fills the screen. */
export const HERO_BLUE_EVENT = 'eresi:hero-blue';

export function announceHeroBlue(on: boolean) {
  window.dispatchEvent(new CustomEvent(HERO_BLUE_EVENT, { detail: on }));
}
