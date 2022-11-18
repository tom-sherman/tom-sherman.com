export const onRequest: PagesFunction = async ({ request }) => {
  console.log("Incoming webook");
  console.log(request.url);
  console.log(await request.text());

  return new Response("OK", { status: 200 });
};
