import { defaultPhysics } from "./consts";
import {
  DefinedPhysicsConfig,
  MoveMode,
  PhysicsConfig,
  PhysicsOptions,
} from "./types";

export function normalizeDefinedPhysicsConfig(theConfig: PhysicsConfig) {
  if (theConfig === undefined) {
    return { default: { ...defaultPhysics() } };
  }
  if (typeof theConfig === "string") {
    return undefined;
  }

  if (
    theConfig.damping !== undefined ||
    theConfig.friction !== undefined ||
    theConfig.mass !== undefined ||
    theConfig.stiffness !== undefined
  ) {
    // is a single config
    return { default: { ...defaultPhysics(), ...theConfig } };
  } else {
    const normalizedMultiConfig: DefinedPhysicsConfig = {};

    const multiConfigKeys = Object.keys(theConfig);
    multiConfigKeys.forEach((loopedKey) => {
      normalizedMultiConfig[loopedKey] = {
        ...defaultPhysics(),
        ...theConfig[loopedKey],
      };
    });

    return normalizedMultiConfig;
  }

  //   return { default: defaultPhysics() };
}

// could make util makeMakerMoverState, that takes a initialValue function (and they type and initial values can be got from that)
export function makeMoverStateMaker<T_ValueType>(
  getDefaultValue: () => T_ValueType
) {
  type MoverInitialState<
    T_ValueType extends any,
    T_MoveConfigName extends string
  > = {
    value?: T_ValueType;
    valueGoal?: T_ValueType;
    isMoving?: boolean;
    moveConfigName?: T_MoveConfigName; // ideally this is inferred
    moveMode?: MoveMode;
    moveConfigs?: Record<T_MoveConfigName, PhysicsOptions>;
  };

  return function moverState<
    T_Name extends string,
    T_PhysicsNames extends string,
    T_InitialState extends MoverInitialState<T_ValueType, T_PhysicsNames>
  >(newName: T_Name, initialState?: T_InitialState) {
    type PropTypesByWord = {
      Goal: T_ValueType;
      IsMoving: boolean;
      MoveMode: MoveMode;
    };

    type NewProps = {
      [K_PropName in keyof PropTypesByWord as `${T_Name}${K_PropName}`]: PropTypesByWord[K_PropName];
    };

    type MoveConfigNameProp = T_InitialState["moveConfigName"] extends undefined
      ? {}
      : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>;

    type MoveConfigsProp = T_InitialState["moveConfigs"] extends undefined
      ? {}
      : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>;

    type NewPropsAndValue = Record<T_Name, T_ValueType> &
      NewProps &
      MoveConfigNameProp &
      MoveConfigsProp;

    const newStateProps = {} as Record<any, any>;

    newStateProps[newName] = initialState?.value ?? getDefaultValue();
    newStateProps[`${newName}Goal`] =
      initialState?.valueGoal ?? getDefaultValue();
    newStateProps[`${newName}IsMoving`] = initialState?.isMoving ?? false;
    newStateProps[`${newName}MoveMode`] =
      initialState?.moveMode ?? ("spring" as MoveMode);

    if (initialState?.moveConfigName) {
      newStateProps[`${newName}MoveConfigName`] = initialState?.moveConfigName;
    }
    // NOTE moveConfigs are usually in refs now? so might not be used
    if (initialState?.moveConfigs) {
      newStateProps[`${newName}MoveConfigs`] = initialState?.moveConfigs;
    }

    return newStateProps as NewPropsAndValue;
  };
}

export function makeStateNames<T_Name extends string>(newName: T_Name) {
  return {
    value: newName as T_Name,
    valueGoal: `${newName}Goal` as `${T_Name}Goal`,
    isMoving: `${newName}IsMoving` as `${T_Name}IsMoving`,
    moveMode: `${newName}MoveMode` as `${T_Name}MoveMode`,
    physicsConfigName: `${newName}MoveConfigName` as
      | `${T_Name}MoveConfigName`
      | undefined,
    physicsConfigs: `${newName}MoveConfigs` as
      | `${T_Name}MoveConfigs`
      | undefined,
  };
}