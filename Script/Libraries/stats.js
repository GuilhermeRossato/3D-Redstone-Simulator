/**
 * @author mrdoob / http://mrdoob.com/
 */
var Stats = function(startsActive) {
	var container = document.createElement('div');
	container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
	container.addEventListener('click', function(event) {
		if (typeof menuClick == "boolean")
			menuClick = true;
		event.preventDefault();
		container.children[0].toggle();
	}, false);
	//
	function addPanel(panel) {
		container.appendChild(panel.dom);
		return panel;
	}
	var beginTime = (performance || Date).now()
	  , prevTime = beginTime
	  , frames = 0;
	var msPanel = addPanel(new Stats.Panel('MS','#0f0','#020', startsActive, 200));
	return {
		REVISION: 16,
		dom: container,
		addPanel: addPanel,
		delta: 0,
		begin: function() {
			beginTime = (performance || Date).now();
		},
		end: function() {
			frames++;
			var time = (performance || Date).now();
			this.delta += time - beginTime;
			return time;
		},
		update: function() {
			beginTime = this.end();
		},
		normalStep: function() {
			msPanel.update(this.delta);
		},
		lagStep: function() {
			msPanel.update(this.delta, true);
			this.delta = 0;
		}
	};
};
Stats.Panel = function(name, fg, bg, startsActive, maxValue) {
	var PR = Math.round(window.devicePixelRatio || 1);
	var WIDTH = 80 * PR
	  , HEIGHT = 48 * PR
	  , TEXT_X = 3 * PR
	  , TEXT_Y = 2 * PR
	  , GRAPH_X = 3 * PR
	  , GRAPH_Y = 15 * PR
	  , GRAPH_WIDTH = 74 * PR
	  , GRAPH_HEIGHT = 30 * PR;
	var canvas = document.createElement('canvas');
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	var context = canvas.getContext('2d');
	canvas.toggle = function() {
		canvas.enabled = !canvas.enabled;
		if (canvas.enabled) {
			canvas.style.cssText = 'width:80px;height:48px';
			canvas.height = HEIGHT;
			context.font = 'bold ' + (9 * PR) + 'px Helvetica,Arial,sans-serif';
			context.textBaseline = 'top';
			context.fillStyle = bg;
			context.fillRect(0, 0, WIDTH, HEIGHT);
			context.fillStyle = fg;
			context.fillText(name, TEXT_X, TEXT_Y);
			context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
			context.fillStyle = bg;
			context.globalAlpha = 0.9;
			context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
		} else {
			canvas.style.cssText = 'width:80px;height:16px';
			canvas.height = 16;
			context.font = 'bold ' + (9 * PR) + 'px Helvetica,Arial,sans-serif';
			context.textBaseline = 'top';
		}
	}
	canvas.enabled = !startsActive;
	canvas.toggle();
	return {
		dom: canvas,
		update: function(value, lagged) {
			context.fillStyle = bg;
			context.globalAlpha = 1;
			context.fillRect(0, 0, WIDTH, GRAPH_Y);
			context.fillStyle = fg;
			context.fillText(Math.round(value) + ' ' + name, TEXT_X, TEXT_Y);
			if (canvas.enabled) {
				context.drawImage(canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT);
				//context.fillStyle = lagged?"#882222":fg;
				context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);
				context.fillStyle = lagged?"#882222":bg;
				context.globalAlpha = 0.9;
				context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, Math.round((1 - (value / maxValue)) * GRAPH_HEIGHT));
			}
		}
	};
}
;
