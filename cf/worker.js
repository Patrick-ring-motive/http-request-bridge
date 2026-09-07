  
const fetchResponse = async (...args) => {
  try {
    return await fetch(...args);
  } catch (e) {
    return new Response(String(e), {
      status: 500,
      statusText: String(e)
    });
  }
};

const fetchTextResponse = async (...args) => {
  try {
    const res = await fetchResponse(...args);
    const body = await res.text();
    return new Response(body,res);
  } catch (e) {
    return new Response(String(e), {
      status: 500,
      statusText: String(e)
    });
  }
};



export default {
  async fetch(request, env, ctx) {
    return fetchResponseText(request);
  },
};
