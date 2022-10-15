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

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    }
    return acc - operation.amount;
  }, 0);

  return balance;
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;
  const customerAlreadyExist = customers.some((customer) => customer.cpf === cpf);

  if (customerAlreadyExist) {
    return response.status(400).json({ message: 'Error! customer already exist' });
  }

  customers.push({
    id: uuidv4(),
    name,
    cpf,
    statement: [],
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

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { currentCustomer } = request;

  const balance = getBalance(currentCustomer.statement);

  if (balance < amount) {
    return response.status(400).json({ message: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  currentCustomer.statement.push(statementOperation);
  response.status(201).send();
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { currentCustomer } = request;
  const { date } = request.query;

  const dateformat = new Date(`${date} 00:00`);

  const statement = currentCustomer.statement
    .filter((currentStatement) => currentStatement
      .created_at.toDateString()
      === new Date(dateformat).toDateString());

  response.status(200).json(statement);
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { currentCustomer } = request;
  const { name } = request.body;

  currentCustomer.name = name;

  response.status(200).json();
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { currentCustomer } = request;

  const customer = {
    id: currentCustomer.id,
    name: currentCustomer.name,
  };
  response.status(200).json(customer);
});

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { currentCustomer } = request;

  customers.splice(currentCustomer, 1);

  response.status(200).json({ message: 'account removed', customers });
});

app.get('/', (request, response) => response.status(201).json(customers));

app.listen(3333);
