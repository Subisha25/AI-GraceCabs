import { Table, Column, Model, DataType, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { FleetOperator } from './fleetOperator';
import { Company } from './company';
import { Package } from './package';

@Table({
  tableName: 'organization_package',
  timestamps: true,
})
export class OrganizationPackage extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => FleetOperator)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  operatorId!: string;

  @BelongsTo(() => FleetOperator)
  operator!: FleetOperator;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  companyId!: string;

  @BelongsTo(() => Company)
  company!: Company;

  @ForeignKey(() => Package)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  packageId!: string;

  @BelongsTo(() => Package)
  package!: Package;

  @Column(DataType.DECIMAL(10, 2))
  customBaseAmount!: number;

  @Column(DataType.DECIMAL(10, 2))
  customExtraKmRate!: number;

  @Column(DataType.DECIMAL(10, 2))
  customExtraHourRate!: number;

  @Column(DataType.DATEONLY)
  effectiveDate!: string;

  @Column(DataType.DATEONLY)
  expiryDate!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
  })
  status!: string;
}
