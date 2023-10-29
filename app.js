//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


main().catch(err => console.log(err));
async function main(){
  await mongoose.connect("mongodb+srv://admin-benita:test123@cluster0.kkgprd6.mongodb.net/?retryWrites=true&w=majority")
}

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your Todo List"
})
const item2 = new Item({
  name: "Hit the + button to add a new item"
})
const item3 = new Item({
  name: "Hit this to delete an item"
})
const defaultItems = [item1, item2, item3]


//List Schema for dynamic routing
const listSchema = {
  name:{
    type: String
  },
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema)

const day = date.getDate();

app.get("/", async (req, res) => {

  try{
    //Reading items in the database
    const foundItems = await Item.find({}).exec();

    if(foundItems.length === 0){
      Item.insertMany(defaultItems);
      res.redirect("/");
    }else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  }catch(err){
    console.log(err);
    res.status(500).send("An error occurred")
  }
});

app.get("/:customListName", async (req, res)=>{
  try{
  const customListName = _.capitalize(req.params.customListName);
  foundList = await List.findOne({ name: customListName }).exec();

  if(!foundList){
    //Create a new list
    const list = new List({
    name: customListName,
    items: defaultItems
  })
   await list.save();
   res.redirect("/" + customListName)
  }else{
    //Show an existing list
    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
  }

  }catch(err){
    console.log(err);
    res.status(500).send("An error occurred")
  }
})

app.post("/", async (req, res) => {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (listName === day) {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName }).exec(); // Use 'await' here

      if (foundList) {
        foundList.items.push(item);
        await foundList.save(); // Use 'await' here
        res.redirect("/" + listName);
      } else {
        console.log("List not found.");
        res.status(404).send("List not found.");
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});


app.post("/delete", async (req, res) => {
  try {
    const checkedItem = req.body.checked;
    const listName = req.body.listName;

    if (listName === day) {
      // Delete the item from the main list
      await Item.findByIdAndRemove(checkedItem);
      res.redirect("/");
    }
    // else {
    //   // Delete the item from a custom list
    //   const foundList = await List.findOneAndUpdate(
    //     { name: listName },
    //     { $pull: { items: { _id: checkedItem } } }
    //   );

    //   if (foundList) {
    //     res.redirect("/" + listName);
    //   }
    // }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred");
  }
});


app.get("/about", (req, res) =>{
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
