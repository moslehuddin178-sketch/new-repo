const express = require("express");
const foodModel = require("../models/food");
const app = express();

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/rolebased");
const timeMiddleware = require("../middleware/time");
const nodemailer = require("nodemailer");


app.get("/foods", async (req, res) => {
  const foods = await foodModel.find({});

  try {
    res.send(foods);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put("/food/:id", async (req, res) => { 

  const id = req.params.id;  
  
  const { calories, ...updateData } = req.body;
 
  try {
    console.log("Request body:", req.body);
     console.log("before update:", updateData);
    
    const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });

    res.send(updatedFood);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});


app.delete("/food/:id", async (req, res) => {

if (String(req.params.id).length !== 24) {
  return res.status(400).send({ message: "Invalid ID format" });
  
}
  try {
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    const food = await foodModel.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).send({ message: "Food not found" });
    }
    res.send({ message: "Food deleted successfully", food });
  } catch (error) {
    res.status(500).send(error);
  }
});



app.post("/food", authMiddleware, roleMiddleware(["admin"]), timeMiddleware, async (req, res) => {
  const food = new foodModel(req.body);

  try {
    await food.save();
    res.send(food);
  } catch (error) {
    res.status(500).send(error);
  }
});



module.exports = app;