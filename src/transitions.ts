// Transition styles for the generated commercial.
//
// A "transition style" tells the Gemini Omni prompt writer how successive
// shots should flow: hard cuts, crossfades, whip pans, match cuts… The choice
// is sent to /api/generate-prompt as a short directive (this file is the
// single source of truth — the server only trusts the id and rebuilds the
// directive from its own copy of the presets).

export interface TransitionStyle {
  id: string;
  label: string;
  /** One-line explanation shown under the picker. */
  hint: string;
  /** Short paragraph appended to the prompt-writer system instruction. */
  directive: string;
}

export const TRANSITION_STYLES: TransitionStyle[] = [
  {
    id: 'director',
    label: 'Director\u2019s choice',
    hint: 'The AI picks the best transitions for the product',
    directive:
      'You choose the transitions: for every cut pick the technique that best serves the shot change \u2014 hard cut, match cut, whip pan or a brief crossfade. Vary them deliberately across the reel; never repeat the same technique more than twice in a row.',
  },
  {
    id: 'hard-cut',
    label: 'Hard Cut',
    hint: 'Snappy, editorial \u2014 instant shot changes',
    directive:
      'Use hard cuts exclusively. Every shot change is an instantaneous editorial cut; no dissolves, fades or morphs of any kind. Vary scale and angle at each cut so the edit feels brisk and intentional.',
  },
  {
    id: 'crossfade',
    label: 'Crossfade',
    hint: 'Smooth, dreamlike dissolves between shots',
    directive:
      'Flow between shots with soft crossfades (0.4\u20130.8s). Every shot change is a gentle dissolve \u2014 no hard cuts. Let each incoming shot resolve fully before the next transition begins; the overall pace stays calm and dreamlike.',
  },
  {
    id: 'whip-pan',
    label: 'Whip Pan',
    hint: 'Energetic motion-blurred swipes',
    directive:
      'Connect most shot changes with whip pans or whip tilts: the outgoing frame blurs with fast horizontal/vertical camera motion and the incoming shot settles from the same blurred motion. At most one plain hard cut in the whole reel, kept for the final hero frame.',
  },
  {
    id: 'match-cut',
    label: 'Match Cut',
    hint: 'Cuts that link shapes, motion or materials',
    directive:
      'Chain the shots with match cuts: each new shot opens on a shape, material or motion direction that visually continues the previous frame (a round handle \u2192 a round plinth, a falling drop \u2192 a beading surface). Cuts stay instantaneous, but every cut must rhyme visually.',
  },
  {
    id: 'l-cut',
    label: 'L-Cut / J-Cut',
    hint: 'Audio leads or trails the picture',
    directive:
      'Bridge the shots with audio lead-ins and tails (J- and L-cuts): the diegetic sound of the next shot (a soft tap, a glass chime) begins under the tail of the previous shot, or lingers after its picture has cut. The picture rhythm stays brisk; the sound carries the flow.',
  },
];

export const DEFAULT_TRANSITION_ID = 'director';

export const transitionById = (id: string): TransitionStyle | undefined =>
  TRANSITION_STYLES.find((t) => t.id === id);

/** Server-safe fallback: anything unknown falls back to the default style. */
export const transitionOrDefault = (id: string | undefined | null): TransitionStyle =>
  transitionById(id ?? '') ?? transitionById(DEFAULT_TRANSITION_ID)!;
