import {
  ok,
  serverError
} from 'wix-http-functions';
import wixData from 'wix-data';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class CMSTable {
  constructor(tableName) {
    this.tableName = tableName;
  }
  async where(prop, value) {
    return await wixData
      .query(this.tableName)
      .eq(prop, value)
      .find();
  }
  async insert(value) {
    return await wixData.insert(this.tableName, value, {
      suppressAuth: true
    })
  }
  async update(id, value) {
    return await wixData.update(this.tableName, {
      ...id,
      ...value
    }, {
      suppressAuth: true
    })
  }
}

const requests = new CMSTable('requests');
const responses = new CMSTable('responses');

async function handleRequest(fn, args = []) {
  try {
    return await fn(...args);
  } catch (err) {
    return serverError({
      body: {
        error: err.message
      }
    });
  }
}

const jsonResponse = x => {
  return ok({
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: x
  });
};

export async function get_items(request) {
  return handleRequest(async () => {
    const results = await wixData
      .query("env")
      .limit(100)
      .find();

    return jsonResponse({
      items: results.items,
      totalCount: results.totalCount
    });
  });
}

export async function get_requests(request) {
  return handleRequest(async () => {
    const results = await responses.where('transaction_status', 'started');
    return jsonResponse({
      items: results.items,
      totalCount: results.totalCount
    });
  });
}

export async function post_request(request) {
  return handleRequest(async () = {
    const transactionId = request.headers['transaction-id'] || `transaction-${Math.random()}`;
    await requests.insert({
      transaction_id: transactionId,
      transaction_status: request.headers['transaction-status'],
      transaction_created: +request.headers['transaction-created'],
      payload: await (await request.body).text(),
    });
    let result = await responses.where('transaction_id', transactionId);
    while (!result?.totalCount) {
      await sleep(1000);
      result = await responses.where('transaction_id', transactionId);
    }
    return jsonResponse(result);
  });
}

import {
  elevate
} from 'wix-auth';
import {
  collections
} from 'wix-data.v2';

const listDataCollections = elevate(collections.listDataCollections);

export async function get_schemas(request) {
  return handleRequest(async () = {
    const result = await listDataCollections();
    return jsonResponse(result.collections.filter(x = /request|responses/.test(x.displayName)).map(x = x.fields.filter(x = !x.systemField).map(y = y.displayName)));
  });
}

export async function post_response(request) {
  const items = JSON.parse(await (await request.body).text());
  for (const item of items) {
    const results = await requests.where('transaction_id', item.transaction_id);
    for (const req of results?.items ?? []) {
      await requests.update(req, {
        transaction_status: 'done'
      });
    }
    await responses.insert(item);
  }
  return ok();
}

export async function get_listen() {
  while (true) {
    try {
      const results = await requests.where('transaction_status', 'started');
      for (const req of results?.items ?? []) {
        await requests.update(req, {
          transaction_status: 'claimed'
        });
        await responses.insert({
          transaction_id: req.transaction_id,
          response: 'claimed'
        });
      }
      if (results?.items?.length) {
        return jsonResponse(results);
      } else {
        await sleep(1000);
      }
    } catch (e) {
      console.warn(e);
    }
  }
}
/*
(async()={

  while(true){
    try{
      await sleep(1000);
      const results = await requests.where('transaction_status','started')
        for(const req of results?.items ?? []){
          await requests.update(req,{transaction_status:'claimed'});
          await responses.insert({transaction_id:req.transaction_id,response:'claimed'});
        }
    }catch(e){
        console.warn(e);
    }
  }

})();

*/
