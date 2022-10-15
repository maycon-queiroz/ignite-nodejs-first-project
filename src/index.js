const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const currentCustomer = customers.find((customer) => customer.cpf === cpf);

  if (!currentCustomer) {
    return response.status(400).json({ message: 'Error! customer not exist' });
  }

  request.currentCustomer = currentCustomer;

  return next();
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;
  const customerAlreadyExist = customers.some((customer) => customer.cpf === cpf);

  if (customerAlreadyExist) {
    return response.status(400).json({ message: 'Error! customer already exist' });
  }

  customers.push({
    id: uuidv4(), name, cpf, statement: [],
  });

  return response.status(201).send();
});

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { currentCustomer } = request;

  response.status(200).json(currentCustomer.statement);
});

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { currentCustomer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };

  currentCustomer.statement.push(statementOperation);
  response.status(201).send();
});

app.get('/', (request, response) => response.status(201).json(customers));

app.listen(3333);
