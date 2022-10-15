# typeorm-stubs

> Stubs generator for `Typeorm` entities. It uses `typeorm metadata` to get the type of the column and generate a random value.

## Contents

- [Usage](#usage)
  - [Simple usage](#simple-usage)
  - [Deep generation](#deep-generation)
  - [Generator overriding](#generator-overriding)
- [Todos](#todos)

# Usage

## Simple usage

You may generate a single stub or an array of stubs from `Typeorm` entity like this:

```typescript
@Entity()
export class MyEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn()
  public createdAt: Date;
  
  @Column({ type: 'varchar', nullable: false })
  public name: string;
  
  @Column({ type: 'integer', nullable: false })
  public index: number;
  
  @Column({ type: 'boolean', nullable: false })
  public isMain: boolean;
}
```

This code generates a single stub:

```typescript
const stub = new Stub().createOne(MyEntity);
```

It gives you an object like this:

```typescript
const stub: MyEntity = {
  id: '125a1c28-2938-4996-95f0-d768cbc3c15e',
  createdAt: new Date('2022-10-09T04:43:05.976Z'),
  name: 'Proin interdum adipiscing vel tortor.',
  index: 487,
  isMain: true,
}
```

For an array of stubs use this code:

```typescript
const stubs = new Stub().createMany(MyEntity, 5);
```

It gives you 5 stubs in array. Param `count` is optional and can be omitted, then random count of stubs will be generated.

## Deep generation

You may create a stub from entity with relations, e.g.:

```typescript
@Entity()
export class MyEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn()
  public createdAt: Date;
  
  @Column({ type: 'varchar', nullable: false })
  public name: string;
  
  @Column({ type: 'integer', nullable: false })
  public index: number;
  
  @Column({ type: 'boolean', nullable: false })
  public isMain: boolean;
  
  @Column({ type: 'uuid', nullable: true })
  public relationId?: string;
  
  @ManyToOne(() => RelationEntity)
  @JoinColumn({ name: 'relationId' })
  public relation?: RelationEntity;
}

@Entity()
export class RelationEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn()
  public createdAt: Date;
  
  @Column({ type: 'varchar', nullable: false })
  public description: string;
  
  @OneToMany(() => DeepRelation)
  public deepRelations: DeepRelation[];
}

@Entity()
export class DeepRelation {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn()
  public createdAt: Date;

  @Column({ type: 'integer', nullable: false })
  public index: number;

  @Column({ type: 'uuid', nullable: true })
  public parentId?: string;

  @ManyToOne(() => RelationEntity)
  @JoinColumn({ name: 'relationId' })
  public parent?: RelationEntity;
}
```

It gives:

```typescript
const stub: MyEntity = {
  id: '125a1c28-2938-4996-95f0-d768cbc3c15e',
  createdAt: new Date('2022-10-09T04:43:05.976Z'),
  name: 'Proin interdum adipiscing vel tortor.',
  index: 487,
  isMain: true,
  relationId: '3631150a-c6be-4fab-9896-182e67056efe',
  relation: {
    id: '3631150a-c6be-4fab-9896-182e67056efe',
    createdAt: new Date('2022-10-09T04:43:05.976Z'),
    description: 'Sit ut, mattis cursus. porttitor feugiat sit malesuada vitae.',
    deepRelations: [
      {
        id: '7d8b2f6b-bd52-424a-adcf-770a979690d1',
        createdAt: new Date('2022-10-09T04:43:05.976Z'),
        index: 15,
        parentId: '3631150a-c6be-4fab-9896-182e67056efe',
      },
      {
        id: '02abe928-08e5-412a-957b-7a45382df9fc',
        createdAt: new Date('2022-10-09T04:43:05.976Z'),
        index: 8,
        parentId: '3631150a-c6be-4fab-9896-182e67056efe',
      },
      {
        id: '74a1ded5-e9d9-4fd4-bb1e-161d4d0df412',
        createdAt: new Date('2022-10-09T04:43:05.976Z'),
        index: 593,
        parentId: '3631150a-c6be-4fab-9896-182e67056efe',
      },
      {
        id: '8baa6530-3fa3-4778-ba11-f675d7d653a4',
        createdAt: new Date('2022-10-09T04:43:05.976Z'),
        index: 967,
        parentId: '3631150a-c6be-4fab-9896-182e67056efe',
      },
    ],
  },
}
```

Foreign keys will be mapped to an entity if it's possible.

> Note that circular dependencies will be omitted, and entities won't be generated twice.

## Generator overriding

You may override a stub generator for specific types, e.g. for `string`. You should create a new class implementing `StubGenerator` interface and pass it to `Stub`:

```typescript
class MyGenerator implements StubGenerator {
  public generateString(_column: ColumnMetadataArgs): string {
    return 'overrided!';
  }
}

const stub = new Stub(MyGenerator).createOne(MyEntity);
```

It gives:

```typescript
const stub: MyEntity = {
  id: '125a1c28-2938-4996-95f0-d768cbc3c15e',
  createdAt: new Date('2022-10-09T04:43:05.976Z'),
  name: 'overrided!',
  index: 487,
  isMain: true,
}
```

# Todos

- Tests
- Overriding by column type
- Generating PostgreSQL arrays, JSONs
