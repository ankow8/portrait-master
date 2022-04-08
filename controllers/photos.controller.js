const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      if(title.length <= 25 && author.length <= 50) {
        const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
        const fileExt = fileName.split('.').slice(-1)[0];

        const titlePattern = new RegExp(/(([A-z|0-9]\s|\.|\,|\;|\:|\-|\!)*)/, 'g');
        const titleMatched = text.match(titlePattern).join('');
        if(titleMatched.length < title.length) throw new Error('Invalid characters...');

        const authorPattern = new RegExp(/(([A-z|0-9]\s|\.|\-|\_)*)/, 'g');
        const authorMatched = text.match(authorPattern).join('');
        if(authorMatched.length < author.length) throw new Error('Invalid characters...');

        const emailPattern = new RegExp(/(([A-z]|\.|[0-9])*)\@(([A-z]|\.|[0-9])*)(?<!@)$/, 'g');
        const emailMatched = text.match(emailPattern).join('');
        if(emailMatched.length < email.length) throw new Error('Invalid characters...');

        if(fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif') {
          const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
          await newPhoto.save(); // ...save new photo in DB
          res.json(newPhoto);
        } else {
          throw new Error('Wrong input!');
        }
      } else {
        throw new Error('Wrong input!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const voter = await Voter.findOne({user: clientIp});
    if(!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });
    } else {
      if(!voter) {
        const newVoter = new Voter({user: clientIp, votes: photoToUpdate._id});
        await newVoter.save();
      } else {
        if(voter.votes.includes(req.params.id)) {
          res.status(500).json({message: 'You have already voted for this photo!'});
        } else {
          voter.votes.push(photoToUpdate._id);
          await voter.save();
        }
      }
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }
};
