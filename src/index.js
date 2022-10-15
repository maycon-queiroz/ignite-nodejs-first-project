const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

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

app.get('/statement/:cpf', (request, response) => {
  const { cpf } = request.params;
  const currentCustomer = customers.find((customer) => customer.cpf === cpf);

  response.status(200).json(currentCustomer.statement);
});

app.get('/', (request, response) => response.status(201).json(customers));

app.listen(3333);
