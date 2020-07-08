// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  endpoint: 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/detect',
  emptyEndpoint: 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/facelists/{faceListId}',
  addEndpoint: 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/facelists/{faceListId}/persistedFaces',
  similarEndpoint: 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/findsimilars',
  bridgeEndpoint: 'https://192.168.1.184:9721/pos/postfaces',
  storeEndpoint: 'pos/GetFile?file=busy_status.json',
  orderEndpoint: 'http://webdot.kpos.ro/xvapi/getorder.php',
  bridgeTestConnect: 'http://{bridgeTestAddr}/pos/testconnect', // 192.168.1.19:9722
  bridgeTransaction: 'http://{bridgeTransactionAddr}/pos/transaction', // 192.168.1.19:9721
  googleEndpoint: 'https://www.google-analytics.com/collect',
  googleBatchEndpoint: 'https://www.google-analytics.com/batch'
};
