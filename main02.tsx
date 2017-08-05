import * as mobx from 'mobx';
import * as mobxr from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

class Todo {
    @mobx.observable items = [];
}

@mobxr.observer
class TodoView extends React.Component<any, any> {
    @mobx.observable text = "";

    constructor(props: any) {
        super(props);
        this.addItem = this.addItem.bind(this);
        this.renderItem = this.renderItem.bind(this);
    }

    addItem() {
        if (this.text.trim() == "") return;
        this.props.todo.items.push({task:this.text,done:false}); 
        this.text = "";
    }

    renderItem(item, id) {
        let style = (done: boolean): React.CSSProperties => {
            if (!done) return {};
            return {
                textDecoration: 'line-through',
                color: 'lightgray',
            };
        };

        let toggleItem = () => {
            item.done = !item.done;
        };

        let removeItem = () => {
            this.props.todo.items.splice(id, 1);
        };

        return (
            <li style={style(item.done)} onClick={toggleItem}>
                {item.task}
                &nbsp;
                <input type='button' onClick={removeItem} value='-'/>
            </li>
        );
    }

    render() { 
        let items = this.props.todo.items;

        let onKeyUp = (e) => {
            if (e.keyCode == 13) 
                this.addItem();
        };
        let onTextChange = (e) => {
            this.text = e.target.value;
        };

        return (
        <div>
            <p>Todo</p>
            <ul>
                {items.map(this.renderItem)}
            </ul>
            <input type='text' value={this.text} 
                onKeyUp={onKeyUp} onChange={onTextChange} />
            <input type='button' value='+' onClick={this.addItem}/>
        </div>);
    }
}

const todo = new Todo();
window['todo'] = todo;

export function main() {
    ReactDOM.render(
        <TodoView todo={todo} />,
        document.body
    );
}

