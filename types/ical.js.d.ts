declare module 'ical.js' {
  namespace ICAL {
    function parse(input: string): unknown;

    class Component {
      constructor(jCal: unknown);
      getAllSubcomponents(name: string): Component[];
    }

    class Time {
      year: number;
      month: number;
      day: number;
      isDate: boolean;
      toJSDate(): Date;
    }

    class Event {
      constructor(component: Component);
      uid: string;
      summary: string;
      description: string;
      startDate: Time;
      endDate: Time;
    }
  }

  export default ICAL;
}
