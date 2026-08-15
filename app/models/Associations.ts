import { User } from "./User";
import { Event } from "./Event";
import { Seat } from "./Seat";
import { Reservation } from "./Reservation";
import { ReservationSeat } from "./Reservation_seat";
import { Payment } from "./Payment";
import { Ticket } from "./Ticket";
import { TicketValidation } from "./Ticket_validation";

export function setupAssociations() {
 
  
  User.hasMany(Event, {
    foreignKey: "organizer_id",
    as: "events",
  });

  Event.belongsTo(User, {
    foreignKey: "organizer_id",
    as: "organizer",
  });

  Event.hasMany(Seat, {
    foreignKey: "event_id",
    as: "seats",
  });

  Seat.belongsTo(Event, {
    foreignKey: "event_id",
    as: "event",
  });

  User.hasMany(Reservation, {
    foreignKey: "customer_id",
    as: "reservations",
  });

  Reservation.belongsTo(User, {
    foreignKey: "customer_id",
    as: "customer",
  });


  Event.hasMany(Reservation, {
    foreignKey: "event_id",
    as: "reservations",
  });

  Reservation.belongsTo(Event, {
    foreignKey: "event_id",
    as: "event",
  });


  Reservation.hasMany(ReservationSeat, {
    foreignKey: "reservation_id",
    as: "reservationSeats",
  });

  ReservationSeat.belongsTo(Reservation, {
    foreignKey: "reservation_id",
    as: "reservation",
  });


  Seat.hasOne(ReservationSeat, {
    foreignKey: "seat_id",
    as: "reservationSeat",
  });

  ReservationSeat.belongsTo(Seat, {
    foreignKey: "seat_id",
    as: "seat",
  });


  Reservation.belongsToMany(Seat, {
    through: ReservationSeat,
    foreignKey: "reservation_id",
    otherKey: "seat_id",
    as: "seats",
  });

  Seat.belongsToMany(Reservation, {
    through: ReservationSeat,
    foreignKey: "seat_id",
    otherKey: "reservation_id",
    as: "reservations",
  });


  Reservation.hasOne(Payment, {
    foreignKey: "reservation_id",
    as: "payment",
  });

  Payment.belongsTo(Reservation, {
    foreignKey: "reservation_id",
    as: "reservation",
  });


  Reservation.hasMany(Ticket, {
    foreignKey: "reservation_id",
    as: "tickets",
  });

  Ticket.belongsTo(Reservation, {
    foreignKey: "reservation_id",
    as: "reservation",
  });

  Seat.hasOne(Ticket, {
    foreignKey: "seat_id",
    as: "ticket",
  });

  Ticket.belongsTo(Seat, {
    foreignKey: "seat_id",
    as: "seat",
  });


  Ticket.hasMany(TicketValidation, {
    foreignKey: "ticket_id",
    as: "validations",
  });

  TicketValidation.belongsTo(Ticket, {
    foreignKey: "ticket_id",
    as: "ticket",
  });

  User.hasMany(TicketValidation, {
    foreignKey: "gate_user_id",
    as: "ticketValidations",
  });

  TicketValidation.belongsTo(User, {
    foreignKey: "gate_user_id",
    as: "gateUser",
  });


  Event.hasMany(TicketValidation, {
    foreignKey: "event_id",
    as: "ticketValidations",
  });

  TicketValidation.belongsTo(Event, {
    foreignKey: "event_id",
    as: "event",
  });
}