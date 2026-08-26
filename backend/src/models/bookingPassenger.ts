import { Table, Column, Model, DataType, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Booking } from './booking';

@Table({
  tableName: 'booking_passenger',
  timestamps: false,
})
export class BookingPassenger extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => Booking)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  bookingId!: string;

  @BelongsTo(() => Booking)
  booking!: Booking;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  passengerName!: string;

  @Column(DataType.STRING)
  passengerPhone!: string;

  @Column(DataType.STRING)
  passengerEmail!: string;
}
