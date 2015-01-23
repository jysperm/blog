#!/usr/bin/env coffee

Socks5ClientHttpsAgent = require 'socks5-https-client/lib/Agent'
request = require 'request'
moment = require 'moment'
ical = require 'ical'
csv = require 'csv'
fs = require 'fs'
_ = require 'underscore'

ICAL_URL = 'https://www.google.com/calendar/ical/jyboxnet%40gmail.com/public/basic.ics'
SLEEPING_FILE = "#{__dirname}/../sleeping.csv"
MATCH_DESCRIPTION = '睡觉'
TIME_FORMAT = 'YYYY-MM-DDTHH:mm'

agent = new Socks5ClientHttpsAgent
  socksHost: 'localhost'
  socksPort: 1080

lastRecordDate = (callback) ->
  fs.readFile SLEEPING_FILE, (err, content) ->
    throw err if err

    csv.parse content, {}, (err, sleeping_data) ->
      callback new Date _.last(sleeping_data)[1].trim()

getDistanceByHours = (from, to) ->
  return parseFloat ((to?.getTime() - from.getTime()) / 3600 / 1000).toFixed 1

request
  url: ICAL_URL
  agent: agent
, (err, _res, body) ->
  lastRecordDate (last_data) ->
    ical_data = ical.parseICS body

    sleeping_data = _.filter _.values(ical_data), (item) ->
      return item.summary == MATCH_DESCRIPTION

    sleeping_data = _.filter sleeping_data, (item) ->
      return item.start > last_data

    for item in sleeping_data
      _.extend item,
        start: new Date item.start
        end: new Date item.end

    sleeping_data.sort (a, b) ->
      return a.start.getTime() - b.start.getTime()

    for item in sleeping_data
      next_sleeping = _.find sleeping_data, (i) ->
        return i.start > item.start

      _.extend item,
        hours: getDistanceByHours item.start, item.end
        hours_to_next: getDistanceByHours item.end, next_sleeping?.start

    sleeping_data.pop()

    for item in sleeping_data
      {start, end, hours, hours_to_next} = item
      start = moment(start).format TIME_FORMAT
      end = moment(end).format TIME_FORMAT
      console.log "#{start}, #{end}, #{hours}h, #{hours_to_next}h"
