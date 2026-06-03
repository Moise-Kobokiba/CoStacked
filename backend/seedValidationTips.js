const mongoose = require('mongoose');
const ValidationTip = require('./models/ValidationTip');

mongoose.connect('mongodb://localhost:27017/costacked');

const seedTips = async () => {
  await ValidationTip.deleteMany();

  await ValidationTip.insertMany([
    {
      title: "Define your ICP.",
      content: "Be specific about who experiences the problem.",
      order: 1,
      isActive: true
    },
    {
      title: "Ask open questions.",
      content: "Avoid leading users toward your desired answer.",
      order: 2,
      isActive: true
    },
    {
      title: "Iterate quickly.",
      content: "If traction is weak, refine your positioning and repost.",
      order: 3,
      isActive: true
    }
  ]);

  console.log('Validation tips seeded');
  mongoose.connection.close();
};

seedTips();
