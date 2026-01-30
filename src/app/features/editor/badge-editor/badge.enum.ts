export enum BadgeType {
    Anniversaire = 'anniversaire',
    Bienvenue = 'bienvenue',
    AuRevoir = 'aurevoir',

}

export const BadgeTypeLabels: Record<BadgeType, string> = {
    [BadgeType.Anniversaire]: 'Joyeux Anniversaire',
    [BadgeType.Bienvenue]: 'Bienvenue',
    [BadgeType.AuRevoir]: 'Au revoir',
};

export const BadgeTypeOptions = Object.entries(BadgeTypeLabels).map(([value, label]) => ({
    value: value as BadgeType,
    label,
}));
