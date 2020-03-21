const axios = require('axios')
const Dev = require('../models/Dev')
const parseStringAsArray = require('../utils/parseStringAsArray')
const { findConnections, sendMessage } = require('../websocket')

module.exports = {
  async index(req, res) {
    const devs = await Dev.find()

    return res.json(devs)
  },

  async show(req, res) {
    const { id } = req.params

    Dev.findById(id, (err, dev) => {
      if (err || !dev) return res.status(404).send(err)

      return res.json(dev)
    })
  },

  async store(req, res) {
    const { github_username, techs, latitude, longitude } = req.body

    let dev = await Dev.findOne({ github_username })

    if (!dev) {
      const gitResponse = await axios.get(`https://api.github.com/users/${github_username}`)

      const { name = login, avatar_url, bio } = gitResponse.data

      const techsArray = parseStringAsArray(techs)

      const location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      }

      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location
      })

      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArray
      )

      sendMessage(sendSocketMessageTo, "new-dev", dev)
    }

    return res.json(dev)
  },

  async update(req, res) {
    const { id } = req.params
    const { techs, latitude, longitude, avatar_url, bio } = req.body

    const techsArray = parseStringAsArray(techs)

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    }

    const newDev = {
      techs: techsArray,
      latitude,
      longitude,
      avatar_url,
      bio,
      location,
    }

    Dev.findByIdAndUpdate(id, newDev, { new: true }, (err, dev) => {
      if (err || !dev) return res.status(404).send(err)

      return res.json(dev)
    })
  },

  async destroy(req, res) {
    const { id } = req.params

    Dev.findByIdAndDelete(id, (err, dev) => {
      if (err || !dev) return res.status(404).send(err)

      return res.json(dev)
    })
  }
}
