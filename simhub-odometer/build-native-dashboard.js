const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'native-dashboard', 'RBR Mechanical Odometer');
const DASH_NAME = 'RBR Mechanical Odometer.djson';
const DIVISORS = [10000, 1000, 100, 10, 1];
const CARD_X = [20, 71, 122, 173, 224];
const CARD_Y = 18;
const CARD_WIDTH = 47;
const CARD_HEIGHT = 76;

const types = {
  rectangle:
    'SimHub.Plugins.OutputPlugins.GraphicalDash.Models.RectangleItem, SimHub.Plugins',
  text: 'SimHub.Plugins.OutputPlugins.GraphicalDash.Models.TextItem, SimHub.Plugins',
};

function binding(expression) {
  return {
    Formula: { JSExt: 0, Interpreter: 1, Expression: expression },
    Mode: 2,
  };
}

function common(name, left, top, width, height) {
  return {
    Height: height,
    Left: left,
    Top: top,
    Visible: true,
    BlinkPhasisInverted: false,
    Width: width,
    Name: name,
    RenderingSkip: 0,
    MinimumRefreshIntervalMS: 0,
  };
}

function rectangle(name, left, top, width, height, color, border = {}) {
  return {
    $type: types.rectangle,
    IsRectangleItem: true,
    BackgroundColor: color,
    BorderStyle: border,
    ...common(name, left, top, width, height),
  };
}

function text(name, value, left, top, width, height, size, color, options = {}) {
  return {
    $type: types.text,
    IsTextItem: true,
    Font: options.font || 'Arial',
    FontSize: size,
    FontWeight: options.weight || 'Normal',
    Text: value,
    TextColor: color,
    HorizontalAlignment: options.horizontal ?? 1,
    VerticalAlignment: options.vertical ?? 1,
    BackgroundColor: options.background || '#00FFFFFF',
    ...common(name, left, top, width, height),
    ...(options.bindings ? { Bindings: options.bindings } : {}),
  };
}

const smoothDistance = `
let target=Number($prop('DataCorePlugin.GameData.NewData.TrackPositionMeters'));
if(!isFinite(target)||target<0) target=root.rbrOdoTarget==null?300:root.rbrOdoTarget;
let now=Date.now()/1000;
if(root.rbrOdoValue==null){root.rbrOdoValue=target;root.rbrOdoTarget=target;root.rbrOdoVelocity=0;root.rbrOdoTime=now;}
let dt=Math.min(Math.max(now-root.rbrOdoTime,0),0.05);root.rbrOdoTime=now;
let restart=target<root.rbrOdoTarget-25||(target<=5&&root.rbrOdoTarget>target+5);
if(restart){root.rbrOdoValue=target;root.rbrOdoVelocity=0;}
root.rbrOdoTarget=target;
let difference=target-root.rbrOdoValue;
root.rbrOdoVelocity+=(difference*42-root.rbrOdoVelocity*13)*dt;
root.rbrOdoValue+=root.rbrOdoVelocity*dt;
if(Math.abs(difference)<0.0005&&Math.abs(root.rbrOdoVelocity)<0.001){root.rbrOdoValue=target;root.rbrOdoVelocity=0;}
let distance=((root.rbrOdoValue%100000)+100000)%100000;
`;

function digitTextFormula(divisor, offset) {
  return `${smoothDistance}
let whole=Math.floor(distance/${divisor});
return ((whole+${offset})%10+10)%10;`;
}

function digitTopFormula(divisor, offset, index) {
  return `${smoothDistance}
let reel=distance/${divisor};let whole=Math.floor(reel);let progress=reel-whole;
let movement=Math.min(Math.abs(root.rbrOdoVelocity)/16,1);
let jitter=Math.sin(Date.now()*0.026+${index}*1.7)*movement*0.45;
return ${CARD_Y}+(${offset}+progress)*${CARD_HEIGHT}+jitter;`;
}

const items = [];

items.push(
  rectangle('InstrumentFace', 0, 0, 342, 122, '#FF161918', {
    BorderColor: '#FF353837',
    BorderTop: 1,
    BorderBottom: 1,
    BorderLeft: 1,
    BorderRight: 1,
    RadiusTopLeft: 6,
    RadiusTopRight: 6,
    RadiusBottomLeft: 6,
    RadiusBottomRight: 6,
  }),
  rectangle('InstrumentHighlight', 2, 2, 338, 3, '#1FFFFFFF'),
  rectangle('ReelBank', 14, 12, 261, 88, '#FF080909', {
    BorderColor: '#FF050606',
    BorderTop: 1,
    BorderBottom: 1,
    BorderLeft: 1,
    BorderRight: 1,
    RadiusTopLeft: 3,
    RadiusTopRight: 3,
    RadiusBottomLeft: 3,
    RadiusBottomRight: 3,
  }),
);

CARD_X.forEach((x, index) => {
  items.push(
    rectangle(`ReelCard${index + 1}`, x, CARD_Y, CARD_WIDTH, CARD_HEIGHT, '#FF151413', {
      BorderColor: '#FF252525',
      BorderTop: 1,
      BorderBottom: 1,
      BorderLeft: 1,
      BorderRight: 1,
      RadiusTopLeft: 2,
      RadiusTopRight: 2,
      RadiusBottomLeft: 2,
      RadiusBottomRight: 2,
    }),
  );

  [-1, 0, 1].forEach((position) => {
    const digitOffset = position === -1 ? 1 : position === 0 ? 0 : -1;
    items.push(
      text(
        `Reel${index + 1}Digit${position + 2}`,
        '0',
        x,
        CARD_Y + position * CARD_HEIGHT,
        CARD_WIDTH,
        CARD_HEIGHT,
        61,
        '#FFD7473E',
        {
          font: 'Arial Narrow',
          horizontal: 1,
          vertical: 1,
          bindings: {
            Text: { Formula: { JSExt: 0, Interpreter: 1, Expression: digitTextFormula(DIVISORS[index], digitOffset) }, Mode: 2 },
            Top: { Formula: { JSExt: 0, Interpreter: 1, Expression: digitTopFormula(DIVISORS[index], position, index) }, Mode: 2 },
          },
        },
      ),
    );
  });
});

// Native Dash Studio layers do not clip children, so these masks form the reel aperture.
items.push(
  rectangle('FaceTopMask', 14, 0, 261, 12, '#FF161918'),
  rectangle('ReelTopMask', 14, 12, 261, 6, '#FF080909'),
  rectangle('ReelBottomMask', 14, 94, 261, 6, '#FF080909'),
  rectangle('FaceBottomMask', 14, 100, 261, 22, '#FF161918'),
);

CARD_X.forEach((x, index) => {
  items.push(
    rectangle(`ReelShadeTop${index + 1}`, x + 1, CARD_Y + 1, CARD_WIDTH - 2, 16, '#99000000'),
    rectangle(`ReelShadeBottom${index + 1}`, x + 1, CARD_Y + 59, CARD_WIDTH - 2, 16, '#AA000000'),
  );
});

items.push(
  text('StartLabel', 'START', 284, 13, 39, 10, 7, '#FF858B86', { weight: 'Bold' }),
  rectangle('StartButton', 290, 25, 27, 27, '#FF3F5145', {
    BorderColor: '#FF090A09', BorderTop: 1, BorderBottom: 1, BorderLeft: 1, BorderRight: 1,
    RadiusTopLeft: 2, RadiusTopRight: 2, RadiusBottomLeft: 2, RadiusBottomRight: 2,
  }),
  text('ResetLabel', 'RESET', 284, 55, 39, 10, 7, '#FF858B86', { weight: 'Bold' }),
  rectangle('ResetButton', 290, 67, 27, 27, '#FF741F1D', {
    BorderColor: '#FF090A09', BorderTop: 1, BorderBottom: 1, BorderLeft: 1, BorderRight: 1,
    RadiusTopLeft: 2, RadiusTopRight: 2, RadiusBottomLeft: 2, RadiusBottomRight: 2,
  }),
  text('UnitLabel', 'METRES', 221, 105, 65, 10, 7, '#FF686D69', { weight: 'Bold' }),
);

const dashboard = {
  DashboardDebugManager: {
    _dashSettingsStores: {},
    WindowPositionSettings: {
      IsFullScreen: false,
      Position: '100,100,342,122',
      TopMost: true,
      AllowTransparency: true,
      CloseOnMonitorLoss: false,
      NoWindowActivate: false,
    },
  },
  Version: 2,
  Id: 'a327ec1f-a138-4e98-9ea7-f27b5a9ce842',
  BaseHeight: 122,
  BaseWidth: 342,
  BackgroundColor: '#00000000',
  Screens: [
    {
      RenderingSkip: 0,
      Name: 'Odometer',
      InGameScreen: true,
      IdleScreen: true,
      PitScreen: false,
      ScreenId: 'eb3b4180-4757-4fb6-9977-9f874ff5e221',
      AllowOverlays: true,
      IsForegroundLayer: false,
      IsOverlayLayer: false,
      OverlayTriggerExpression: { Expression: '' },
      ScreenEnabledExpression: { Expression: '' },
      OverlayMaxDuration: 0,
      OverlayMinDuration: 0,
      IsBackgroundLayer: false,
      BackgroundColor: '#00000000',
      Items: items,
      MinimumRefreshIntervalMS: 0,
    },
  ],
  SnapToGrid: false,
  HideLabels: false,
  ShowForeground: true,
  ForegroundOpacity: 100,
  ShowBackground: true,
  BackgroundOpacity: 100,
  ShowBoundingRectangles: false,
  GridSize: 1,
  Images: [],
  Metadata: {
    SettingsBuilder: { Settings: [], IsEditMode: false },
    ScreenCount: 1,
    InGameScreensIndexs: [0],
    IdleScreensIndexs: [0],
    MainPreviewIndex: 0,
    IsOverlay: true,
    OverlaySizeWarning: false,
    MetadataVersion: 2,
    EnableOnDashboardMessaging: true,
    PitScreensIndexs: [],
    PreferredTouchMode: 0,
    SimHubVersion: '9.12.2',
    Category: 'Rally',
    Title: 'RBR Mechanical Odometer',
    Description: 'Native five-reel mechanical stage-distance odometer for Richard Burns Rally.',
    Author: 'Erik Pantzar',
    Width: 342,
    Height: 122,
    DashboardVersion: '1.0',
  },
  ShowOnScreenControls: false,
  IsOverlay: true,
  EnableClickThroughOverlay: true,
  EnableOnDashboardMessaging: true,
  UseStrictJSIsolation: false,
  UseStrictJSIsolationWarning: true,
};

const metadata = dashboard.Metadata;

const testRoot = {};
for (const item of items) {
  for (const entry of Object.values(item.Bindings || {})) {
    const expression = entry.Formula?.Expression;
    if (!expression) continue;
    const result = Function('$prop', 'root', expression)(
      (property) => property.endsWith('TrackPositionMeters') ? 3732.8 : null,
      testRoot,
    );
    if (result === undefined || (typeof result === 'number' && !Number.isFinite(result))) {
      throw new Error(`Invalid binding result in ${item.Name}`);
    }
  }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, DASH_NAME), JSON.stringify(dashboard));
fs.writeFileSync(
  path.join(OUTPUT_DIR, `${DASH_NAME}.metadata`),
  `${JSON.stringify(metadata, null, 2)}\n`,
);
fs.copyFileSync(path.join(__dirname, 'og.png'), path.join(OUTPUT_DIR, `${DASH_NAME}.png`));
fs.copyFileSync(path.join(__dirname, 'og.png'), path.join(OUTPUT_DIR, `${DASH_NAME}.00.png`));

console.log(path.join(OUTPUT_DIR, DASH_NAME));
