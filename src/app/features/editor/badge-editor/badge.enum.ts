export enum BadgeType {
    Birthday = 'BADGE_TYPES.BIRTHDAY',
    Welcome = 'BADGE_TYPES.WELCOME',
    Farewell = 'BADGE_TYPES.FAREWELL',
    Quote = 'BADGE_TYPES.QUOTE',
    Custom = 'BADGE_TYPES.CUSTOM',
}

// labels are translation keys; templates should translate them with the translate pipe
export const BadgeTypeLabels: Record<BadgeType, string> = {
    [BadgeType.Birthday]: 'BADGE_TYPES.BIRTHDAY',
    [BadgeType.Welcome]: 'BADGE_TYPES.WELCOME',
    [BadgeType.Farewell]: 'BADGE_TYPES.FAREWELL',
    [BadgeType.Quote]: 'BADGE_TYPES.QUOTE',
    [BadgeType.Custom]: 'BADGE_TYPES.CUSTOM',
};

export const BadgeTypeOptions = Object.entries(BadgeTypeLabels).map(([value, label]) => ({
    value: value as BadgeType,
    label,
}));
