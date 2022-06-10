const { Client } = require("@notionhq/client")
const userID = "b1fe9197-c09d-4a11-a4cf-2646235253f9"
const databaseID = "0a2a2d9b79a4461c804f2fd999ed5fa2"
const userToken = "b9351db93caa442483f8b7e60789ecfa315b420b3244d9bd495fc8231bb086ef96835e8a097b4467894d582a8befd3ac0d3cc1d9134215b566711195207c93d610be1f75def148605b866a9a2d86"
const bearerToken = "secret_uZqFitx05Bx49d4phn2n46rXdpXQFN6QpPzJOXR1t9I"

// Initializing a client
const notion = new Client({
    auth: bearerToken,
})

// create new date
const date = new Date()
// to iso string
const dateISO = date.toISOString()

async function notionInteraction(title, description, time, tag, modify) {
    try {
        let response, view

        if(modify === true){
            response = await notion.pages.create({
                parent: { database_id: databaseID },
                properties: {
                    title: {
                        title:[
                            {
                                "text": {
                                    "content": title
                                }
                            }
                        ]
                    },
                    Description: {
                        rich_text: [
                            {
                                text: {
                                    content: description,
                                },
                            },
                        ],
                    },
                    Date:{
                        "date": {
                            "start": time
                        }
                    },
                    'Tags': {
                        multi_select: [
                            {
                                name: tag
                            }
                        ]
                    },
                },
            })
            console.log(response)
        }else{
            view = await notion.pages.retrieve({
                page_id:databaseID
            })
            console.log(view)
        }

        console.log("Success")

    } catch (error) {
        console.error(error.body)
    }
}

notionInteraction("title", "description", dateISO, "ISTP", false)