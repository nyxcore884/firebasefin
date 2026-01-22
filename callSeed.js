
const firebase = require("firebase/app");
require("firebase/functions");

const config = {
  // ... your firebase config
};

firebase.initializeApp(config);

const seedDatabase = firebase.functions().httpsCallable('seedDatabase');

seedDatabase().then((result) => {
  console.log(result.data.success);
});
