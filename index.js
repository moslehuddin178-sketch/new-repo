const express = require('express');
const app = express();
const port = 3000;

const service = [
  { id: 1, name: 'home cleaning' },
  { id: 2, name: 'car wash' },
  { id: 3, name: 'food'},
  { id: 4, name: 'pet care' },
  
];

app.get('/api/service', (req, res) => {
  res.json(service);
});

app.get('/api/service/:id', (req, res) => {
  console.log(req.params.id);
  const item = service.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).send('Item not found');
  res.json(item);
});




app.delete('/api/service/:id', (req, res) => {
  console.log('id',req.params.id);
  const itemIndex = service.findIndex(i => i.id === parseInt(req.params.id));
  console.log(itemIndex, 'itemIndex');
  if (itemIndex === -1) return res.status(404).send('Item not found');

  const deletedItem = service.splice(itemIndex, 1);
  console.log('Deleted item:', deletedItem);
    res.status(200).json({ message: 'Deleted successfully', deletedItem });
});

app.get('/status', (req, res) => {
  res.json({ status: 'never checked' });
});

app.put('/update', (req, res) => {
  res.send('Update received via put request!!');
});
app.post('/create', (req, res) => {  res.send('Create received via post request!!');
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});