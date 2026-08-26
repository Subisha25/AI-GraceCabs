import {
  Table, Column, Model, DataType, PrimaryKey, ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { FleetOperator } from './fleetOperator';
import { Company } from './company';
import { VehicleType } from './vehicleType';

@Table({
  tableName: 'schedules',
  timestamps: true,
})
export class Schedule extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  scheduleId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  scheduleName!: string;

  @ForeignKey(() => FleetOperator)
  @Column({ type: DataType.UUID, allowNull: true })
  operatorId!: string;

  @ForeignKey(() => Company)
  @Column({ type: DataType.UUID, allowNull: false })
  organizationId!: string;

  @BelongsTo(() => Company, { foreignKey: 'organizationId' })
  organization!: Company;

  @Column({ type: DataType.TEXT, allowNull: false })
  pickupLocation!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  dropLocation!: string;

  @Column({ type: DataType.STRING })
  days!: string; // Comma-separated: "Mon,Tue,Wed"

  @Column({ type: DataType.TIME })
  pickupTime!: string;

  @Column({ type: DataType.DATEONLY })
  startDate!: string;

  @Column({ type: DataType.DATEONLY })
  endDate!: string;

  @ForeignKey(() => VehicleType)
  @Column({ type: DataType.UUID, allowNull: true })
  vehicleTypeId!: string;

  @BelongsTo(() => VehicleType)
  vehicleType!: VehicleType;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  passengerCount!: number;

  @Column({ type: DataType.TEXT })
  notes!: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'active',
  })
  status!: string;
}
