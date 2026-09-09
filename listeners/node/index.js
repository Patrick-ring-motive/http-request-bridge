(async()=>{

while(true){
    try{
        const res = await fetch('https://lenguapediaorg.wixstudio.com/bridge/_functions/listen');
        (async()=>{
            const text = await res.text();
            const data = JSON.parse(text);
            const items = data?.items ?? [];
            const returnItems = items.map(item => {
                return {
                    transaction_id: item.transaction_id,
                    response: [...new Set(text)].join('')
                };
            });
            console.log('returnItems', returnItems);
            await fetch('https://lenguapediaorg.wixstudio.com/bridge/_functions/response',{
                method:'POST',
                body:JSON.stringify(returnItems),
            });
        })().catch(console.warn);
    }catch(e){
        console.warn(e);
    }
}

})();
