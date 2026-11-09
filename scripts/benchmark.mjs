const url = process.env.BENCH_URL || "http://localhost:4000/api/books?limit=8";
const warmups = 5,
  runs = 50;
for (let i = 0; i < warmups; i++) await fetch(url);
const times = [];
for (let i = 0; i < runs; i++) {
  const start = performance.now();
  const response = await fetch(url);
  await response.arrayBuffer();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      url,
      warmups,
      runs,
      meanMs: +(times.reduce((s, n) => s + n, 0) / runs).toFixed(2),
      medianMs: +times[Math.floor(runs / 2)].toFixed(2),
      p95Ms: +times[Math.ceil(runs * 0.95) - 1].toFixed(2),
    },
    null,
    2,
  ),
);
