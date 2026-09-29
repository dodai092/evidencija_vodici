// Places the small "562p" value labels above bars without letting them overprint.
// A label that collides with an already placed one moves up a line; after two lines it is dropped
// (the table under the chart still has every value).

const LINE = 11;
const MAX_RAISES = 2;

export function placeBarLabels(labels, measure) {
    const placed = [];
    const out = new Array(labels.length).fill(null);
    const order = labels.map((l, i) => i).sort((a, b) => labels[a].x - labels[b].x);
    const collides = (a, b) => Math.abs(a.x - b.x) < (measure(a.text) + measure(b.text)) / 2 && Math.abs(a.y - b.y) < LINE - 1;

    for (const i of order) {
        for (let r = 0; r <= MAX_RAISES; r++) {
            const cand = { ...labels[i], y: labels[i].y - r * LINE };
            if (!placed.some(p => collides(p, cand))) {
                placed.push(cand);
                out[i] = cand;
                break;
            }
        }
    }
    return out;
}
