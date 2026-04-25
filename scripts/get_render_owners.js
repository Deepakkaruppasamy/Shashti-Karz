async function getOwners() {
  const response = await fetch('https://api.render.com/v1/owners', {
    headers: {
      'Authorization': 'Bearer rnd_A21N71OZCwsHaR0uiDqwZRXyQDsD'
    }
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
getOwners();
