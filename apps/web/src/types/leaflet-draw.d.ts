declare module 'leaflet-draw' {
  import * as L from 'leaflet';
  
  namespace L {
    namespace Control {
      class Draw extends L.Control {
        constructor(options?: any);
      }
    }
    
    namespace Draw {
      namespace Event {
        const CREATED: string;
        const EDITED: string;
        const DELETED: string;
        const DRAWSTART: string;
        const DRAWSTOP: string;
        const DRAWVERTEX: string;
        const EDITSTART: string;
        const EDITMOVE: string;
        const EDITRESIZE: string;
        const EDITSTOP: string;
        const DELETESTART: string;
        const DELETESTOP: string;
      }
    }
  }
  
  export = L;
}
