
import React, { useEffect } from 'react'
import PeptideStackVis from '../vis/PeptideStackViz'

export default function VisContainer() {
  let v;
  useEffect(() => {
    let v = new PeptideStackVis([{
      "Entry": "P07662",
      "Sequence" : "MKVLILACLVALALARETIESLSSSEESITEYKQKVEKVKHEDQQQGEDEHQDKIYPSFQPQPLIYPFVEPIPYGFLPQNILPLAQPAVVLPVPQPEIMEVPKAKDTVYTKGRVMPVLKSPTIPFFDPQIPKLTDLENLHLPLPLLQPLMQQVPQPIPQTLALPPQPLWSVPQPKVLPIPQQVVPYPQRAVPVQALLLNQELLLNPTHQIYPVTQPLAPVHNPISV"
    }],[],"#viscontainer");
    v.buildSplitAxes("P07662");
  })

  return (
    <svg id="viscontainer"></svg>
  )
}
