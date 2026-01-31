import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Entity {
    id: string;
    name: string;
    parentId: string | null;
    ownershipPct: number;
    currency: string;
    region?: string;
    isConsolidationNode: boolean;
    type: 'legal_entity' | 'branch' | 'region' | 'holding';
    consolidationMethod: 'full' | 'proportionate' | 'equity' | 'cost';
}

interface EntityState {
    entities: Entity[];
    loading: boolean;
    error: string | null;
    selectedEntityId: string | null;
}

const initialState: EntityState = {
    entities: [
        {
            id: 'socar_energy_georgia',
            name: 'SOCAR Energy Georgia (Parent)',
            parentId: null,
            ownershipPct: 100,
            currency: 'GEL',
            isConsolidationNode: true,
            type: 'holding',
            consolidationMethod: 'full',
        },
        {
            id: 'sgg_corp',
            name: 'SGG (Corporate)',
            parentId: 'socar_energy_georgia',
            ownershipPct: 100,
            currency: 'GEL',
            isConsolidationNode: false,
            type: 'legal_entity',
            consolidationMethod: 'full',
        },
        {
            id: 'imereti',
            name: 'Imereti Region',
            parentId: 'sgg_corp',
            ownershipPct: 100,
            currency: 'GEL',
            isConsolidationNode: false,
            type: 'branch',
            consolidationMethod: 'full',
        },
        // Adding bootstrap entities matching SOCAR_HIERARCHY for continuity
        { id: 'kakheti', name: 'Kakheti Region', parentId: 'sgg_corp', ownershipPct: 100, currency: 'GEL', isConsolidationNode: false, type: 'branch', consolidationMethod: 'full' },
        { id: 'kartli', name: 'Kartli Region', parentId: 'sgg_corp', ownershipPct: 100, currency: 'GEL', isConsolidationNode: false, type: 'branch', consolidationMethod: 'full' },
        { id: 'adjara', name: 'Adjara Region', parentId: 'sgg_corp', ownershipPct: 100, currency: 'GEL', isConsolidationNode: false, type: 'branch', consolidationMethod: 'full' },
        { id: 'guria_samegrelo', name: 'Guria-Samegrelo Region', parentId: 'sgg_corp', ownershipPct: 100, currency: 'GEL', isConsolidationNode: false, type: 'branch', consolidationMethod: 'full' },
        { id: 'telavgas', name: 'TelavGas', parentId: 'socar_energy_georgia', ownershipPct: 80, currency: 'GEL', isConsolidationNode: false, type: 'legal_entity', consolidationMethod: 'full' },
        { id: 'sog', name: 'SOG (SOCAR Oil & Gas)', parentId: 'socar_energy_georgia', ownershipPct: 100, currency: 'GEL', isConsolidationNode: true, type: 'legal_entity', consolidationMethod: 'full' },
        { id: 'sog_imereti', name: 'SOG-Imereti', parentId: 'sog', ownershipPct: 100, currency: 'GEL', isConsolidationNode: false, type: 'branch', consolidationMethod: 'full' },
        { id: 'sog_kakheti', name: 'SOG-Kakheti', parentId: 'sog', ownershipPct: 100, currency: 'GEL', isConsolidationNode: false, type: 'branch', consolidationMethod: 'full' },
    ],
    loading: false,
    error: null,
    selectedEntityId: null,
};

const entitySlice = createSlice({
    name: 'entities',
    initialState,
    reducers: {
        setEntities: (state, action: PayloadAction<Entity[]>) => {
            state.entities = action.payload;
        },
        addEntity: (state, action: PayloadAction<Entity>) => {
            state.entities.push(action.payload);
        },
        updateEntity: (state, action: PayloadAction<Entity>) => {
            const index = state.entities.findIndex(e => e.id === action.payload.id);
            if (index !== -1) {
                state.entities[index] = action.payload;
            }
        },
        deleteEntity: (state, action: PayloadAction<string>) => {
            state.entities = state.entities.filter(e => e.id !== action.payload);
        },
        selectEntity: (state, action: PayloadAction<string | null>) => {
            state.selectedEntityId = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const {
    setEntities,
    addEntity,
    updateEntity,
    deleteEntity,
    selectEntity,
    setLoading,
    setError,
} = entitySlice.actions;

export default entitySlice.reducer;
