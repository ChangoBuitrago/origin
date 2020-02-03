import { IEvent, SupportedEvents } from '@energyweb/origin-backend-core';
import { IEventClient, ISubscription } from '@energyweb/origin-backend-client';

export class EventClientMock implements IEventClient {
    public started: boolean = false;

    private allCallbacks: ISubscription[] = [];

    start() {
        this.started = true;
    }

    stop() {
        this.started = false;
    }

    subscribe(event: SupportedEvents, callback: Function) {
        if (!this.started) {
            throw new Error('Please start the Event Client');
        }

        this.allCallbacks.push({
            event,
            callback
        });
    }

    triggerEvent(event: IEvent) {
        if (!this.started) {
            throw new Error('Please start the Event Client');
        }

        const matchingCallbacks = this.allCallbacks.filter(cb => cb.event === event.type);
        matchingCallbacks.forEach(cb => cb.callback(event));
    };
}