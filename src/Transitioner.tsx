﻿import * as React from 'react';

export interface ITransitionStatus {
    active?: boolean;
    transitionStyle?: string; // NOTE: no transition if transitionStyle is not provided. Transitioner will then act as on/off switch for the component
}
export interface Props_Trsn extends ITransitionStatus {
    className?: string;
    ignoreScroll?: boolean; // if set to true, scrollPos is not maintained for this transitional component
    id?: string; // unique id, if defined, used to memorize scroll position for id

    onAppeared?: () => void;
    onDisappeared?: () => void;
}

const TrsnState = {
    Appearing: 0,
    Appeared: 1,
    Disappearing: 2,
    Disappeared: 3
}

interface IState {
    trsnState: number;
}
export class Transitioner extends React.Component<Props_Trsn, IState> {
    state = { trsnState: TrsnState.Disappeared };
    scrollPos = (this.props.id && Transitioner.scrollMap[this.props.id]) || 0;
    static skipFirstActiveTrsn = true; // if true (default), skip the very first transition of active component. This is for SPA app that initial page load does not do transition. especially for server-side-rendering.
    static scrollMap: { [id: string]: number } = {};

    componentDidMount() {
        if (this.props.active) Transitioner.skipFirstActiveTrsn = false;

        this.updateTransitionState(this.state.trsnState !== TrsnState.Disappeared);
    }

    shouldComponentUpdate(nextProps: Props_Trsn, nextState: IState) {
        // only re-render if active/transitionStyle/trsnState are different
        // note: callback functions don't affect rendering. so they are ignored even a new one is created
        return this.props.active !== nextProps.active || this.props.transitionStyle !== nextProps.transitionStyle || this.props.className !== nextProps.className || this.state.trsnState !== nextState.trsnState;
    }

    static getDerivedStateFromProps(props: Props_Trsn, state: IState) {
        if (props.active) {
            switch (state.trsnState) {
                case TrsnState.Disappeared:
                    // CRITICAL: page first load should not perform transition/animation. because that requires client javascript to execute and start the css animation.
                    // This results in skyrocketed Perceptual Speed Index.
                    // setting state as TrsnState.Appeared for active components will prevent animation during first load.
                    if (Transitioner.skipFirstActiveTrsn || !props.transitionStyle) return { trsnState: TrsnState.Appeared }; // initial page load, or no style, skip transition
                    return { trsnState: TrsnState.Appearing };
                case TrsnState.Disappearing:
                    // fast user actions that trigger multiple transitions before previous transitions are done
                    // probably user clicks on screen that triggers change of animation of this component
                    return { trsnState: TrsnState.Appeared }; // just show it without animation
            }
        } else {
            switch (state.trsnState) {
                case TrsnState.Appeared:
                    if (!props.transitionStyle) return { trsnState: TrsnState.Disappeared };
                    return { trsnState: TrsnState.Disappearing };
                case TrsnState.Appearing:
                    // fast user actions that trigger multiple transitions before previous transitions are done
                    // probably user clicks on screen that triggers change of animation of this component
                    return { trsnState: TrsnState.Disappeared }; // stop animation and just make the component disappeared
            }
        }

        return null;
    }

    updateTransitionState = (stateChanged: boolean) => {
        // NOTE: triggering transition can only be done thru adding/removing classes by javascript. Doing it through render() will not trigger animation.
        var trsnTag = this.getTrsnRef();
        var scrollingElement = document.scrollingElement;
        if (this.props.active) {
            switch (this.state.trsnState) {
                case TrsnState.Appearing:
                    if (this.isTransition()) {
                        document.body.classList.add('trsn');
                        setTimeout(() => { // delay execution is needed to ensure DOM gets updated
                            if (this.scrollPos !== 0) (this.refs['trsn'] as any).style.top = '-' + this.scrollPos + 'px'; // top needs to be set again when the component is re-appeared. (because it's gone when disappeared)

                            trsnTag.classList.remove('disappeared');
                            trsnTag.classList.add('appearing');
                        }, 20); // a slightly more timeout so that disappearing page is off the scrollingElement first before appearing page is added. Otherwise, both appearing/disappearing elements may be all on scrollingElement causing scroll bar to show and hide quickly
                    } else this.setState({ trsnState: TrsnState.Appeared }); // css transition style not defined
                    return true;
                case TrsnState.Appeared:
                    document.body.classList.remove('trsn');
                    if (this.scrollPos > 0 && scrollingElement) {
                        // once page appeared (position should be relative), restore the scroll position
                        (this.refs['trsn'] as any).style.top = null;
                        scrollingElement.scrollTop = this.scrollPos;
                    }
                    if (stateChanged && this.props.onAppeared) this.props.onAppeared();
                    return true;
            }
        } else { // not active
            switch (this.state.trsnState) {
                case TrsnState.Disappeared:
                    if (stateChanged && this.props.onDisappeared) this.props.onDisappeared();
                    return true;
                case TrsnState.Disappearing:
                    if (scrollingElement && !this.props.ignoreScroll) {
                        this.scrollPos = scrollingElement.scrollTop; // maintain scroll position, need this even when scrollTop = 0
                        if (this.props.id) Transitioner.scrollMap[this.props.id] = this.scrollPos;

                        if (scrollingElement.scrollTop > 0) { // move to top while keeping page at same spot visually
                            scrollingElement.scrollTop = 0;
                            (this.refs['trsn'] as any).style.top = '-' + this.scrollPos + 'px';
                        }
                    }

                    if (this.isTransition()) {
                        setTimeout(() => { // delay execution is needed to ensure DOM gets updated
                            trsnTag.classList.remove('appeared');
                            if (this.props.transitionStyle) trsnTag.classList.add(this.props.transitionStyle);
                            trsnTag.classList.add('disappearing');
                        }, 10);
                    } else this.setState({ trsnState: TrsnState.Disappeared }); // css transition style not defined
                    return true;
            }
        }
        return false;
    }

    componentDidUpdate(prevProps: Props_Trsn, prevState: IState) {
        this.updateTransitionState(this.state.trsnState !== prevState.trsnState);
    }

    getTrsnRef = () => this.refs['trsn'] as HTMLElement;
    isTransition = () => {
        var trsn = this.refs['trsn'] as HTMLElement;
        if (typeof window === 'undefined') return false;
        return getComputedStyle(trsn).getPropertyValue('transition-duration') !== '0s';
    }

    // NOTE: onTransitionEnd can be invoked if this.props.children has some animation. only toggle if this.state.trsnState hasn't reached the correct state yet.
    onFinish = (evt: any) => {
        console.log('onFinish');
        if (evt.target !== this.refs['trsn']) return; // this happens when an element inside the block did some animation (e.g. underline bar of the tab bar moves)
        if (this.props.active && this.state.trsnState === TrsnState.Appearing) this.setState({ trsnState: TrsnState.Appeared }); // finished transitioning
        else if (!this.props.active && this.state.trsnState === TrsnState.Disappearing) this.setState({ trsnState: TrsnState.Disappeared }); // finished transitioning
    }

    render() {
        const { className, transitionStyle } = this.props;
        var cn = transitionStyle;
        switch (this.state.trsnState) {
            case TrsnState.Disappearing:
                cn = transitionStyle + ' appeared';
                break;
            case TrsnState.Appeared:
                cn = 'appeared';
                break;
            case TrsnState.Appearing:
            case TrsnState.Disappeared:
                cn = transitionStyle + ' disappeared'; // keep disappeared status first when about to appear again (first rendered) (so it's position is absolute and won't affect the transition of the disappearing component)
                break;
        }
        cn += (className ? ' ' + className : '');
        return (!this.props.active && this.state.trsnState === TrsnState.Disappeared ? null : <div ref='trsn' className={cn} onTransitionEnd={this.onFinish}>{this.props.children}</div>);
    }
}

interface Props_Trsn_TG extends Props_Trsn {
    in?: boolean; // from TransitionGroup
    onExited?: () => void; // from TransitionGroup
    transitionStyleDisappear?: string; // if provided, style used when disappearing
}
export class Transitioner_TG extends React.Component<Props_Trsn_TG, any> {
    onDisappeared = () => {
        if (this.props.onExited) this.props.onExited();
        if (this.props.onDisappeared) this.props.onDisappeared();
    }
    render() {
        var { onExited, active: ignored, in: active, onDisappeared, transitionStyle, transitionStyleDisappear, ...props_rest } = this.props;
        if (!active && transitionStyleDisappear) transitionStyle = transitionStyleDisappear;
        return (<Transitioner active={active} transitionStyle={transitionStyle} onDisappeared={this.onDisappeared} {...props_rest}>{this.props.children}</Transitioner>);
    }
}