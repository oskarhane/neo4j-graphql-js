import { GraphQLInt, GraphQLString } from 'graphql';
import { Neo4jTypeName, buildNeo4jType } from '../types/types';
import { buildName, buildField, buildNamedType, buildInputValue } from '../ast';

export const TemporalType = {
  TIME: 'Time',
  DATE: 'Date',
  DATETIME: 'DateTime',
  LOCALTIME: 'LocalTime',
  LOCALDATETIME: 'LocalDateTime'
};

const Neo4jTimeField = {
  HOUR: 'hour',
  MINUTE: 'minute',
  SECOND: 'second',
  MILLISECOND: 'millisecond',
  MICROSECOND: 'microsecond',
  NANOSECOND: 'nanosecond',
  TIMEZONE: 'timezone'
};

const Neo4jDateField = {
  YEAR: 'year',
  MONTH: 'month',
  DAY: 'day'
};

const Neo4jTypeFormatted = {
  FORMATTED: 'formatted'
};

const Neo4jTime = {
  [Neo4jTimeField.HOUR]: GraphQLInt.name,
  [Neo4jTimeField.MINUTE]: GraphQLInt.name,
  [Neo4jTimeField.SECOND]: GraphQLInt.name,
  [Neo4jTimeField.MILLISECOND]: GraphQLInt.name,
  [Neo4jTimeField.MICROSECOND]: GraphQLInt.name,
  [Neo4jTimeField.NANOSECOND]: GraphQLInt.name,
  [Neo4jTimeField.TIMEZONE]: GraphQLString.name
};

const Neo4jDate = {
  [Neo4jDateField.YEAR]: GraphQLInt.name,
  [Neo4jDateField.MONTH]: GraphQLInt.name,
  [Neo4jDateField.DAY]: GraphQLInt.name
};

export const buildTemporalTypes = ({ typeMap, config = {} }) => {
  config.temporal = decideTemporalConfig(config);
  const temporalConfig = config.temporal;
  Object.values(TemporalType).forEach(typeName => {
    const typeNameLower = typeName.toLowerCase();
    if (temporalConfig[typeNameLower] === true) {
      const objectTypeName = `${Neo4jTypeName}${typeName}`;
      const inputTypeName = `${objectTypeName}Input`;
      let fields = [];
      if (typeName === TemporalType.DATE) {
        fields = Object.entries(Neo4jDate);
      } else if (typeName === TemporalType.TIME) {
        fields = Object.entries(Neo4jTime);
      } else if (typeName === TemporalType.LOCALTIME) {
        fields = Object.entries({
          ...Neo4jTime
        }).filter(([name]) => name !== Neo4jTimeField.TIMEZONE);
      } else if (typeName === TemporalType.DATETIME) {
        fields = Object.entries({
          ...Neo4jDate,
          ...Neo4jTime
        });
      } else if (typeName === TemporalType.LOCALDATETIME) {
        fields = Object.entries({
          ...Neo4jDate,
          ...Neo4jTime
        }).filter(([name]) => name !== Neo4jTimeField.TIMEZONE);
      }
      let inputFields = [];
      let outputFields = [];
      fields.forEach(([fieldName, fieldType]) => {
        const fieldNameLower = fieldName.toLowerCase();
        const fieldConfig = {
          name: buildName({ name: fieldNameLower }),
          type: buildNamedType({
            name: fieldType
          })
        };
        inputFields.push(buildInputValue(fieldConfig));
        outputFields.push(buildField(fieldConfig));
      });
      const formattedFieldConfig = {
        name: buildName({
          name: Neo4jTypeFormatted.FORMATTED
        }),
        type: buildNamedType({
          name: GraphQLString.name
        })
      };
      inputFields.push(buildInputValue(formattedFieldConfig));
      outputFields.push(buildField(formattedFieldConfig));
      typeMap = buildNeo4jType({
        inputTypeName,
        inputFields,
        objectTypeName,
        outputFields,
        typeMap
      });
    }
  });
  return typeMap;
};

const decideTemporalConfig = config => {
  let defaultConfig = {
    time: true,
    date: true,
    datetime: true,
    localtime: true,
    localdatetime: true
  };
  const providedConfig = config ? config.temporal : defaultConfig;
  if (typeof providedConfig === 'boolean') {
    if (providedConfig === false) {
      defaultConfig.time = false;
      defaultConfig.date = false;
      defaultConfig.datetime = false;
      defaultConfig.localtime = false;
      defaultConfig.localdatetime = false;
    }
  } else if (typeof providedConfig === 'object') {
    Object.keys(defaultConfig).forEach(e => {
      if (providedConfig[e] === undefined) {
        providedConfig[e] = defaultConfig[e];
      }
    });
    defaultConfig = providedConfig;
  }
  return defaultConfig;
};
