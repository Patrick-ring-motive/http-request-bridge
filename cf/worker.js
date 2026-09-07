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
      return new Response(body, res);
    } catch (e) {
      return new Response(String(e), {
        status: 500,
        statusText: String(e)
      });
    }
  };

  const transact = async (payload, env) => {
    const req = new Request(`${env?.WIX_HOST}/request`, {
      method: "POST",
      headers: {
        "transaction-id": `transaction-${crypto.randomUUID()}`,
        "transaction-status": "started",
        "transaction-created": Date.now()
      },
      body: payload
    });
    return fetchTextResponse(req);
  };

  export default {
    async fetch(request, env, ctx) {
      try {
        const payload = request.body ? (await request.text()) : request.url;
        return await transact(payload, env);
      } catch (e) {
        return new Response(String(e), {
          status: 500,
          statusText: String(e)
        });
      }
    },
  };
