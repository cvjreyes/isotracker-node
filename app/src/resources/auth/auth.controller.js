const userModel = require('../users/user.model');
const jwt = require('jsonwebtoken');

const login = async(req, res) => {
    const { email, password } = req.body;
    const user = userModel.findByEmail(email);
    console.log(user.password)
    if (user.password === password)
    {
      const token = jwt.sign({email: email, role: 'admin'}, process.env.TOKEN_SECRET);
      res.json(token);
    } 
    else {
      res.status(401).send("Username or password incorrect");
    }
};

module.exports = {
  login
};

