import { Table, Column, Model, DataType, PrimaryKey, HasMany } from 'sequelize-typescript';
import { Employee } from './employee';
import { Company } from './company';
import { User } from './user';
import { Drivers } from './drivers';
import { Vendor } from './vendor';
import { Partner } from './Partner';
import { Vehicle } from './vehicle';
import { Booking } from './booking';

@Table({
  tableName: 'fleet_operator',
  timestamps: true,
})
export class FleetOperator extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  operatorId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  operatorName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  contactEmail!: string;

  @Column(DataType.STRING)
  contactPhone!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
  })
  status!: string;

  @HasMany(() => Employee)
  employees!: Employee[];

  @HasMany(() => Company)
  companies!: Company[];

  @HasMany(() => User)
  users!: User[];

  @HasMany(() => Drivers)
  drivers!: Drivers[];

  @HasMany(() => Vendor)
  vendors!: Vendor[];

  @HasMany(() => Partner)
  partners!: Partner[];

  @HasMany(() => Vehicle)
  vehicles!: Vehicle[];

  @HasMany(() => Booking)
  bookings!: Booking[];
}
