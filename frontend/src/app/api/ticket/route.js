import { Chance } from "chance";

import { NextResponse } from "next/server";

const chance = new Chance();

let TicketData = [
  {
    Id: 1,
    ticketTitle: "Sed ut perspiciatis unde omnis iste",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Closed",
    Label: "error",
    thumb: "/images/profile/user-10.jpg",
    AgentName: "Liam",
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 2,
    ticketTitle: "Consequuntur magni dolores eos qui ratione",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Pending",
    Label: "warning",
    thumb: "/images/profile/user-2.jpg",
    AgentName: "Steve",
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 3,
    ticketTitle: "Exercitationem ullam corporis",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Open",
    Label: "success",
    thumb: "/images/profile/user-3.jpg",
    AgentName: "Jack",
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 4,
    ticketTitle: "Sed ut perspiciatis unde omnis iste",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Closed",
    Label: "error",
    thumb: "/images/profile/user-4.jpg",
    AgentName: "Steve",
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 5,
    ticketTitle: "Exercitationem ullam corporis",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Closed",
    Label: "error",
    thumb: "/images/profile/user-5.jpg",
    AgentName: "Liam",
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 6,
    ticketTitle: "Consequuntur magni dolores eos qui ratione",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Pending",
    Label: "warning",
    thumb: "/images/profile/user-6.jpg",
    AgentName: "Jack",
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 7,
    ticketTitle: "Sed ut perspiciatis unde omnis iste",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Open",
    Label: "success",
    thumb: "/images/profile/user-7.jpg",
    AgentName: "Steve",
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 8,
    ticketTitle: "Consequuntur magni dolores eos qui ratione",
    ticketDescription:
      "ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos",
    Status: "Closed",
    Label: "error",
    thumb: "/images/profile/user-8.jpg",
    AgentName: "John",
    Date: chance.date(),
    deleted: false,
  },
];

let resetTickets = [...TicketData];

// GET request to retrieve Ticket data
export async function GET(req) {
  let isBrowserRefreshed = req.headers.get("browserrefreshed");
  try {
    if (isBrowserRefreshed === "false") {
      return NextResponse.json({
        status: 200,
        msg: "Success",
        data: TicketData,
      });
    } else {
      TicketData = resetTickets;
      return NextResponse.json({
        status: 200,
        msg: "Success",
        data: resetTickets,
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 400,
      msg: "Internal server error",
      error,
    });
  }
}

// DELETE endpoint for deleting a ticket
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const tickets = TicketData.map((ticket) =>
      ticket.Id === id ? { ...ticket, deleted: true } : ticket
    );
    TicketData = tickets;
    return NextResponse.json({ status: 200, msg: "Success", data: TicketData });
  } catch (error) {
    return NextResponse.json({
      status: 400,
      msg: "Internal server error",
      error,
    });
  }
}

// create endpoint for create a ticket
export async function POST(req) {
  try {
    const newTicket = await req.json();
    TicketData.push(newTicket);
    return NextResponse.json({ status: 200, msg: "Success", data: TicketData });
  } catch (error) {
    return NextResponse.json({
      status: 400,
      msg: "Internal server error",
      error,
    });
  }
}
