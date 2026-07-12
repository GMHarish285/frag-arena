import { BaseWorldConfig } from './WorldConfig';
import { BasePlayerConfig } from './PlayerConfig';
import { BaseWeaponConfig } from './WeaponConfig';
import { MAP_REGISTRY } from './MapConfig';

class ConfigurationManager {
    private static instance: ConfigurationManager;

    public world!: typeof BaseWorldConfig;
    public player!: typeof BasePlayerConfig;
    public weapons!: typeof BaseWeaponConfig;
    public maps = MAP_REGISTRY;

    private constructor() {
        this.resetToBase();
    }

    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    public resetToBase() {
        // Deep clone allows us to mutate stats in-memory during gameplay safely
        this.world = JSON.parse(JSON.stringify(BaseWorldConfig));
        this.player = JSON.parse(JSON.stringify(BasePlayerConfig));
        this.weapons = JSON.parse(JSON.stringify(BaseWeaponConfig));
    }
}

export const GameConfig = ConfigurationManager.getInstance();