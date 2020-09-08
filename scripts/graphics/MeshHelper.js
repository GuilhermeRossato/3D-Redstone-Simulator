const SIDE_DISPLACEMENT = [
	{'name': 'Front',	'origin': ['z', 1],		'rotation': ['y', 0],		'inverse': [0, 0, -1],	'inverseId': 1},
	{'name': 'Back',	'origin': ['z', -1],	'rotation': ['y', 1],		'inverse': [0, 0, 1],	'inverseId': 0},
	{'name': 'Right',	'origin': ['x', 1],		'rotation': ['y', 0.5],		'inverse': [-1, 0, 0],	'inverseId': 3},
	{'name': 'Left',	'origin': ['x', -1],	'rotation': ['y', -0.5],	'inverse': [1, 0, 0],	'inverseId': 2},
	{'name': 'Top',		'origin': ['y', 1],		'rotation': ['x', -0.5],	'inverse': [0, -1, 0],	'inverseId': 5},
	{'name': 'Bottom',	'origin': ['y', -1],	'rotation': ['x', 0.5],		'inverse': [0, 1, 0],	'inverseId': 4}
];

export default SIDE_DISPLACEMENT;