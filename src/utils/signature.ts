export const toRVSignature = (signature: string) => {
  const parsedJSON = JSON.parse(signature) as [string, string];

  return {
    v: parsedJSON[0].slice(0, 2) === '02' ? 0 : 1,
    r: parsedJSON[0].slice(2),
    s: parsedJSON[1],
  };
};
