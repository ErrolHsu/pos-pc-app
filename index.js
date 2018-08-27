const express = require('express');
const app = express();
const port = 3000;
const ecr = require('./ECR-js/main');
const { Transaction } = require('./ECR-js/EcrData');

// parse request body json
// app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  let transaction = new Transaction();
  transaction.refund('000000110100', '123456', 'reference012');
  console.log(transaction.data)
  let data = transaction.PackTransactionData();
  ecr.call(data).then((response) => {
    res.send(response.toString())
  }).catch((err) => {
    console.log(transaction.data)
    res.send(err.toString())
  });
});





app.listen(port, () => console.log(`listening on port ${port}`) )
