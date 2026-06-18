

async function seed() {
  const funnels = [
    {
      name: "Signup Flow",
      steps: [
        "http://localhost:5174/",
        "http://localhost:5174/pricing",
        "http://localhost:5174/signup",
        "http://localhost:5174/dashboard"
      ]
    },
    {
      name: "Feature Discovery",
      steps: [
        "http://localhost:5174/",
        "http://localhost:5174/features",
        "http://localhost:5174/pricing"
      ]
    }
  ];

  for (const f of funnels) {
    try {
      const res = await fetch('http://localhost:4000/api/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f)
      });
      console.log(await res.json());
    } catch (e) {
      console.error(e);
    }
  }
}

seed();
