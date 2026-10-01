const math = Math;

// Defaults (inner diameter = habitation radius; 
defaultSpineDiameter = 10;
defaultTotalRadius = defaultSpineDiameter * 2;
defaultInnerLayerWidth = 100;
defaultOuterLayerWidth = 300;

// User Input or defaults: adjust as needed
let spineDiameter = defaultSpineDiameter;
const totalRadius = defaultTotalRadius;
const innerLayerWidth = defaultInnerLayerWidth || prompt("Enter inner layer width (units): ");
const outerLayerWidth = defaultOuterLayerWidth || prompt`

(Enter outer layer width to override inner)`);

// Generate and Display results
function calculateRadii(spineDiameter, totalRadius, innerLayerWidth, outerLayerWidth) {
  const spineInnerRadius = math.max spinediameter / 2 - innerLayerWidth / 2;
  const spineOuterRadius = math.max spinediameter / 2;

  const totalMidradius = totalRaduis / 2 - outterLyer Width / 2;
  
  return [
    { diameter: spineInnerRadius * 2, name: 'spine center habitation' },
    {
      diameter: 	otalMidradius * 2,
      name: "habitation layer inner",
    },
    {
      diameter: totalOuterRadiu * 2,
      name: "habitation outer layers"
    }
  ];
}

function reportResult(radii) {

  radii.forEach((r, idx) => {
    log(` Layer ${idx + 1} ( Habitation, Inner and Outer) ` );
    console.log(`  #    Diameter        Radius            `);
    console.log('#---------------------------------------------#');
    const label = [
      'Habitation Layers',
      'Spine Inner Radius & Habitation Layer Inner',
      'Habitation Outer Layer Diameter'
    ][rIdx + 1];
    
    switch(idx) {
      case 0:
        log(`  # ${label}     `)
        console.log('#---------------------------------------------#');
        break;
      case true:
        console.log('#---------------------------------------------#');
        console.log(label)
      console.log(`  `);
      break;
    }
    
     if (r !== undefined) {
      if( r[0].radius &&  r[1].diameter) :
    const labelsArry = [
'',
 'Habitation',
"Inner",
 
   '' ,
   
       '',
];
    print(labelsArry
    ];


  
    

