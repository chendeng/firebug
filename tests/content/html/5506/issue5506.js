function runTest()
{
    FBTest.sysout("issue5506.START");

    FBTest.openNewTab(basePath + "html/5506/issue5506.html", function(win)
    {
        FBTest.openFirebug();
        FBTest.selectPanel("html");

        FBTest.selectElementInHtmlPanel("test2", function(node)
        {
            // Start markup editing.
            FBTest.clickToolbarButton(null, "fbToggleHTMLEditing");

            var contentEl = win.document.getElementById("content");

            var panelStatus = FW.Firebug.chrome.window.document.getElementById("fbPanelStatus");
            var panelNode = FBTest.getPanel("html").panelNode;
            var textArea = panelNode.querySelector("textarea");

            FBTest.focus(textArea);

            function replaceWith(str)
            {
                FBTest.sendShortcut("a", {ctrlKey: true});
                if (str === "")
                    FBTest.synthesizeKey("VK_BACK_SPACE", null, win);
                else
                    FBTest.sendString(str, textArea);
                FW.Firebug.Editor.update(true);
            }

            function verifyPath(name)
            {
                var buttons = panelStatus.querySelectorAll("toolbarbutton");
                FBTest.compare(name, buttons[0].label, "First element in the path must be \"" + name + "\".");
                FBTest.compare("html", buttons[buttons.length-1].label, "Last element in the path must be \"html\".");
            }

            function clickPath(ind, callback)
            {
                var buttons = panelStatus.querySelectorAll("toolbarbutton");

                // For whatever reason, newly created elements can't receive clicks immediately.
                setTimeout(function()
                {
                    buttons[ind].click();
                    callback();
                }, 500);
            }

            function verifyHtml(html)
            {
                FBTest.compare(html, contentEl.innerHTML, "The page's HTML must match.");
            }

            var orig = '<b id="test2">&lt;&nbsp;&gt;  </b>';
            FBTest.compare(orig, textArea.value, "The original value must be correct.");
            verifyPath("b#test2");

            var str = "<i></i><b></b><i></i>";
            replaceWith(str);
            verifyPath("b");

            var strDiv = '<div id="test1">a2' + str + 'b2</div>';
            verifyHtml('a1' + strDiv + 'b1');

            clickPath(0, function()
            {
                verifyPath("b");
                FBTest.compare("<b></b>", textArea.value, "Only the element should be shown after clicking it in the element path.");

                clickPath(1, function()
                {
                    verifyPath("b");
                    FBTest.compare(strDiv, textArea.value, "The value must change to the div's contents.");

                    replaceWith("<b invalid=\"");
                    verifyPath("section#content");
                    verifyHtml("a1b1");

                    FBTest.compare(2, contentEl.childNodes.length, "There must be two text nodes in #content.");
                    contentEl.removeChild(contentEl.firstChild);
                    contentEl.removeChild(contentEl.firstChild);

                    var newEl = win.document.createElement("span");
                    contentEl.appendChild(newEl);

                    strDiv = "<strong></strong>hi";
                    replaceWith(strDiv);
                    verifyPath("strong");
                    verifyHtml(strDiv + "<span></span>");

                    // Stop markup edit mode.
                    FBTest.clickToolbarButton(null, "fbToggleHTMLEditing");

                    // XXX waitForHtmlMutation doesn't seem to work here
                    var maxTime = Date.now() + 2000;
                    function testSel()
                    {
                        var nodeBox = panelNode.querySelector(".nodeBox.selected");
                        var tc = nodeBox.textContent, wanted = "<strong></strong>";
                        if (tc !== wanted && Date.now() < maxTime)
                        {
                            setTimeout(testSel, 10);
                        }
                        else
                        {
                            FBTest.compare(wanted, tc, "The edited element must get visibly selected afterwards.");
                            FBTest.testDone("issue5506.DONE");
                        }
                    }
                    testSel();
                });
            });
        });
    });
}
