
import React from 'react'
import PeptideStackVis from '../vis/PeptideStackViz'

export default function VisContainer() {
  let v = new PeptideStackVis([{
    "Entry": "P07662",
    "Sequence" : "MKVLILACLVALALARETIESLSSSEESITEYKQKVEKVKHEDQQQGEDEHQDKIYPSFQPQPLIYPFVEPIPYGFLPQNILPLAQPAVVLPVPQPEIMEVPKAKDTVYTKGRVMPVLKSPTIPFFDPQIPKLTDLENLHLPLPLLQPLMQQVPQPIPQTLALPPQPLWSVPQPKVLPIPQQVVPYPQRAVPVQALLLNQELLLNPTHQIYPVTQPLAPVHNPISV"
  }],[],"#viscontainer");
  v.buildAxis("P07662");
  return (
    <div id="viscontainer">VisContainer</div>
  )
}
